import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState
} from 'react';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';

import { channel as $channelContent } from '../content';
import { useUser } from './User';
import useContextHook from './useContextHook';
import { useChannel } from './Channel';
import { useNotif } from './Notification';
import useChatActions from '../pages/Channel/Chat/useChatConnection/useChatActions';
import { CHAT_LOG_LEVELS, MAX_RECONNECT_ATTEMPTS } from '../constants';
import { ivsChatWebSocketRegionOrUrl } from '../api/utils';
import {
  CHAT_USER_ROLE,
  requestChatToken
} from '../pages/Channel/Chat/useChatConnection/utils';
import { ChatRoom } from 'amazon-ivs-chat-messaging';
import {
  extractChannelIdfromChannelArn,
  updateVotes,
  isVotingBlocked
} from '../utils';
import { usePoll } from './StreamManagerActions/Poll';
import { CHAT_MESSAGE_EVENT_TYPES } from '../constants';

const {
  SEND_MESSAGE,
  START_POLL,
  END_POLL,
  SUBMIT_VOTE,
  SEND_VOTE_STATS,
  HEART_BEAT
} = CHAT_MESSAGE_EVENT_TYPES;

const $content = $channelContent.chat;

const { INFO: info, DEBUG: debug } = CHAT_LOG_LEVELS;

const Context = createContext(null);
Context.displayName = 'Chat';

/**
 * @typedef {Object} SenderAttributes
 * @property {string} avatar
 * @property {string} color
 * @property {string} displayName
 *
 * @typedef {Object} Sender
 * @property {SenderAttributes} Attributes
 * @property {string} UserId
 *
 * @typedef {Object} Message
 * @property {object|null=} Attributes
 * @property {string} Content
 * @property {string} Id
 * @property {string=} RequestId
 * @property {Date} SendTime
 * @property {Sender} Sender
 * @property {string} Type
 *
 * @typedef {Array<Message>} Messages
 */

const actionTypes = {
  INIT_MESSAGES: 'INIT_MESSAGES',
  ADD_MESSAGE: 'ADD_MESSAGE',
  DELETE_MESSAGE: 'DELETE_MESSAGE',
  DELETE_MESSAGES_BY_USER_ID: 'DELETE_MESSAGES_BY_USER_ID'
};

const reducer = (messages, action) => {
  switch (action.type) {
    case actionTypes.INIT_MESSAGES: {
      return action.initialMessages || [];
    }
    case actionTypes.ADD_MESSAGE: {
      const { message: newMessage, isOwnMessage } = action;

      return [...messages, { ...newMessage, isOwnMessage }];
    }
    case actionTypes.DELETE_MESSAGE: {
      const { messageId: messageIdToDelete, deletedMessageIds } = action;
      const wasDeletedByUser =
        deletedMessageIds.current.includes(messageIdToDelete);

      const newMessages = messages.reduce(
        (acc, msg) => [
          ...acc,
          msg.id === messageIdToDelete
            ? { ...msg, isDeleted: true, wasDeletedByUser }
            : msg
        ],
        []
      );

      return newMessages;
    }
    case actionTypes.DELETE_MESSAGES_BY_USER_ID: {
      const { userId: userIdToDelete } = action;

      const newMessages = messages.filter(
        (msg) => msg.sender.attributes.channelArn !== userIdToDelete
      );

      return newMessages;
    }
    default:
      throw new Error('Unexpected action type');
  }
};

export const Provider = ({ children }) => {
  /** @type {[Messages, Function]} */
  const [messages, dispatch] = useReducer(reducer, []);

  /**
   * `sentMessageIds` and `deletedMessageIds` have to be refs to avoid redefining `addMessage` which would reset the chat connection.
   * `sentMessageIds` and `deletedMessageIds` are used to show the notifications upon message deletion.
   * The corresponding messages are flagged respectively using the `isOwnMessage` and `wasDeletedByUser` booleans which are attached to `messages` (used for rendering).
   */
  const sentMessageIds = useRef([]);
  const deletedMessageIds = useRef([]);
  const { userData, isSessionValid } = useUser();
  const { username: ownUsername } = userData || {};
  const savedMessages = useRef({});
  const { channelData, refreshChannelData } = useChannel();
  const { username: chatRoomOwnerUsername, isViewerBanned = false } =
    channelData || {};
  const { notifyError, dismissNotif } = useNotif();
  const retryConnectionAttemptsCounterRef = useRef(0);
  const chatCapabilities = useRef([]);

  // Connection State
  const [hasConnectionError, setHasConnectionError] = useState();
  const [sendAttemptError, setSendAttemptError] = useState();
  const connection = useRef(null);
  const [room, setRoom] = useState(null);
  const isConnectionOpenRef = useRef(false);

  const isInitializingConnection = useRef(false);
  // const isRetryingConnection = useRef(false);
  // const connection = useRef();
  const abortControllerRef = useRef();
  const isConnecting = isInitializingConnection.current;

  // Chat Actions
  const [deletedMessage, setDeletedMessage] = useState();
  const { actions, chatUserRole, updateUserRole } = useChatActions({
    chatCapabilities,
    isConnectionOpen: isConnectionOpenRef.current,
    connection,
    setSendAttemptError
  });

  // Poll Stream Action
  const {
    updatePollData,
    votes,
    hasPollEnded,
    resetPollProps,
    isActive,
    clearLocalStorage,
    isSubmitting,
    saveToLocalStorage,
    setSelectedOption,
    selectedOption,
    setIsVoting,
    getPollDataFromLocalStorage,
    showFinalResults,
    duration,
    question,
    expiry,
    startTime,
    noVotesCaptured,
    tieFound,
  } = usePoll();
  const { pathname } = useLocation();

  const startPoll = useCallback(
    async (pollStreamActionData) => {
      const content = JSON.stringify(pollStreamActionData);
      const attributes = { eventType: START_POLL };

      await actions.sendMessage(content, attributes);
      return true;
    },
    [actions]
  );

  const endPoll = useCallback(
    ({ withTimeout, timeoutDuration } = {}) => {
      const content = 'end poll';
      const attributes = { eventType: END_POLL };
      if (withTimeout) {
        setTimeout(
          () => actions.sendMessage(content, attributes),
          timeoutDuration
        );
      } else {
        actions.sendMessage(content, attributes);
      }
      clearLocalStorage();
    },
    [actions, clearLocalStorage]
  );

  const sendHeartBeat = useCallback(() => {
    if (isActive && !showFinalResults && !noVotesCaptured && !tieFound) {
      actions.sendMessage(HEART_BEAT, {
        eventType: HEART_BEAT,
        updatedVotes: JSON.stringify(votes),
        duration: JSON.stringify(duration),
        question: JSON.stringify(question),
        expiry: JSON.stringify(expiry),
        startTime: JSON.stringify(startTime),
      });
    }
  }, [actions, duration, expiry, isActive, noVotesCaptured, question, showFinalResults, startTime, tieFound, votes]);

  useEffect(() => {
    let heartBeatIntervalId = null;
    if (!showFinalResults && isActive) {
      heartBeatIntervalId = setInterval(() => {
        sendHeartBeat();
      }, 4000);
    }

    return () => {
      if (heartBeatIntervalId !== null) {
        clearInterval(heartBeatIntervalId);
      }
    };
  }, [isActive, sendHeartBeat, showFinalResults]);

  // const connect = useCallback(() => {

  // }, [chatRoomOwnerUsername, disconnect, isViewerBanned, notifyError]);

  const isModerator = chatUserRole === CHAT_USER_ROLE.MODERATOR;

  const initMessages = useCallback(() => {
    const initialMessages = savedMessages.current[chatRoomOwnerUsername] || [];

    dispatch({ type: actionTypes.INIT_MESSAGES, initialMessages });
  }, [chatRoomOwnerUsername]);

  const addMessage = useCallback(
    (message) => {
      const isOwnMessage = ownUsername === message.sender.userId;

      // Upon receiving a new message, we detect if the message was sent by the current user
      if (isOwnMessage) sentMessageIds.current.push(message.id);

      dispatch({ type: actionTypes.ADD_MESSAGE, message, isOwnMessage });
    },
    [ownUsername]
  );

  const removeMessage = useCallback((messageId) => {
    dispatch({
      type: actionTypes.DELETE_MESSAGE,
      messageId,
      deletedMessageIds
    });
  }, []);

  const removeMessageByUserId = useCallback((userId) => {
    dispatch({
      type: actionTypes.DELETE_MESSAGES_BY_USER_ID,
      userId
    });
  }, []);

  // messages local state
  const handleDeleteMessage = useCallback(
    (messageId) => {
      removeMessage(messageId);
      setDeletedMessage(messageId);
    },
    [removeMessage]
  );

  const handleUserDisconnect = useCallback(
    (bannedUsername) => {
      const bannedUserChannelId =
        extractChannelIdfromChannelArn(bannedUsername);

      if (bannedUserChannelId === userData?.trackingId.toLowerCase()) {
        // This user has been banned
        notifyError($content.notifications.error.you_have_been_banned);
        refreshChannelData();
      }
    },
    [notifyError, refreshChannelData, userData?.trackingId]
  );

  const disconnect = useCallback(() => {
    abortControllerRef.current?.abort();
    refreshChannelData();
    setRoom(null);
    connection.current = null;
    chatCapabilities.current = null;
    isInitializingConnection.current = false;
    isConnectionOpenRef.current = false;
  }, [refreshChannelData]);

  const connect = useCallback(() => {
    if (
      isViewerBanned !== false ||
      !chatRoomOwnerUsername ||
      isInitializingConnection.current
    )
      return;

    // Clean up previous connection resources
    abortControllerRef.current = new AbortController();
    if (connection.current) disconnect();

    isInitializingConnection.current = true;
    setHasConnectionError(false);

    // create a new instance of chat room
    const { signal } = abortControllerRef.current;
    const room = new ChatRoom({
      regionOrUrl: ivsChatWebSocketRegionOrUrl,
      maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
      tokenProvider: async () => {
        const data = await requestChatToken(chatRoomOwnerUsername, signal);

        if (data?.error) {
          retryConnectionAttemptsCounterRef.current += 1;
          if (
            retryConnectionAttemptsCounterRef.current === MAX_RECONNECT_ATTEMPTS
          ) {
            isInitializingConnection.current = false;
            notifyError($content.notifications.error.error_loading_chat, {
              withTimeout: false
            });
            setHasConnectionError(true);
          }
        } else {
          chatCapabilities.current = data.capabilities;
        }

        return {
          ...data,
          ...(!data?.error && {
            sessionExpirationTime: new Date(data.sessionExpirationTime)
          })
        };
      }
    });

    room.logLevel = process.env.NODE === 'production' ? info : debug;
    room.connect();
    setRoom(room);
    connection.current = room;
    isConnectionOpenRef.current = true;
    isInitializingConnection.current = false;
  }, [chatRoomOwnerUsername, disconnect, isViewerBanned, notifyError]);

  // Initialize connection
  useEffect(() => {
    connect();

    return disconnect;
  }, [connect, disconnect]);

  useEffect(() => {
    // If chat room listeners are not available, do not continue
    if (!room || !room.addListener) {
      return;
    }

    const unsubscribeOnConnect = room.addListener('connect', () => {
      updateUserRole();
      dismissNotif();
    });

    const unsubscribeOnDisconnect = room.addListener('disconnect', () => {
      isConnectionOpenRef.current = false;
      connection.current = null;
      setRoom(null);
      chatCapabilities.current = [];

      updateUserRole();
    });

    const unsubscribeOnUserDisconnect = room.addListener(
      'userDisconnect',
      (event) => {
        const { trackingId } = userData;
        const { userId: bannedUserId } = event;

        handleUserDisconnect(bannedUserId);

        const bannedUserChannelId =
          extractChannelIdfromChannelArn(bannedUserId);
        if (bannedUserChannelId !== trackingId.toLowerCase()) {
          removeMessageByUserId(bannedUserId);
        }
      }
    );

    const unsubscribeOnMessage = room.addListener('message', (message) => {
      const {
        attributes: {
          eventType = undefined,
          voter = undefined,
          option = undefined
        },
        content
      } = message;
      switch (eventType) {
        case HEART_BEAT:
          const date = JSON.parse(message.attributes.startTime);
          const currentTime = Date.now();
          const delay = (currentTime - date) / 1000;
          const moderator = isModerator && pathname === '/manager';

          if (moderator) return;
          updatePollData({
            duration: Number(JSON.parse(message.attributes.duration)),
            question: JSON.parse(message.attributes.question),
            votes: JSON.parse(message.attributes.updatedVotes),
            isActive: true,
            expiry: JSON.parse(message.attributes.expiry),
            startTime: JSON.parse(message.attributes.startTime),
            delay
          });

          if (message.attributes.voters && !selectedOption) {
            const votersList = JSON.parse(message.attributes.voters);
            setSelectedOption(votersList[userData?.trackingId.toLowerCase()]);
            setIsVoting(false);
          }
          break;
        case SEND_VOTE_STATS:
          const updatedVotes = JSON.parse(message.attributes.updatedVotes);
          updatePollData({ votes: updatedVotes });
          break;
        case SUBMIT_VOTE:
          const shouldBlockVote = isVotingBlocked(
            JSON.parse(message.attributes.duration),
            JSON.parse(message.attributes.startTime)
          );

          const canProcessVote =
            isModerator && pathname === '/manager' && !shouldBlockVote;

          if (canProcessVote) {
            const currentVotes = updateVotes(message, votes);
            updatePollData({ votes: currentVotes });
            const pollData = getPollDataFromLocalStorage();
            saveToLocalStorage({
              votes: currentVotes,
              voters: { ...(pollData.voters || {}), [voter]: option }
            });

            actions.sendMessage(SEND_VOTE_STATS, {
              eventType: SEND_VOTE_STATS,
              updatedVotes: JSON.stringify(currentVotes)
            });
          }
          break;
        case START_POLL:
          const {
            votes: options,
            duration,
            question,
            expiry,
            startTime,
            delay: del = 0
          } = JSON.parse(content);
          updatePollData({
            duration,
            question,
            votes: options,
            isActive: true,
            expiry,
            startTime,
            delay: del
          });
          break;
        case END_POLL:
          resetPollProps();
          break;
        case SEND_MESSAGE:
          addMessage(message);
          break;
        default:
          break;
      }
    });

    const unsubscribeOnMessageDelete = room.addListener(
      'messageDelete',
      (deletedMessage) => {
        const {
          attributes: { MessageID },
          reason
        } = deletedMessage;

        handleDeleteMessage(MessageID, reason);
      }
    );

    return () => {
      unsubscribeOnConnect();
      unsubscribeOnDisconnect();
      unsubscribeOnMessage();
      unsubscribeOnMessageDelete();
      unsubscribeOnUserDisconnect();
    };
  }, [
    addMessage,
    room,
    updateUserRole,
    dismissNotif,
    handleDeleteMessage,
    handleUserDisconnect,
    userData,
    removeMessageByUserId,
    updatePollData,
    resetPollProps,
    hasPollEnded,
    isModerator,
    pathname,
    votes,
    actions,
    isActive,
    isSubmitting,
    saveToLocalStorage,
    selectedOption,
    setSelectedOption,
    setIsVoting,
    getPollDataFromLocalStorage
  ]);

  // We are saving the chat messages in local state for only the currently signed-in user's chat room,
  // and removing them from local state once the user has signed out
  useEffect(() => {
    if (isSessionValid) {
      if (
        ownUsername &&
        chatRoomOwnerUsername &&
        chatRoomOwnerUsername === ownUsername
      ) {
        savedMessages.current[ownUsername] = messages.map((message) => ({
          ...message,
          isPreloaded: true
        }));
      }
    } else {
      savedMessages.current = {};
    }
  }, [isSessionValid, messages, ownUsername, chatRoomOwnerUsername]);

  const value = useMemo(
    () => ({
      addMessage,
      deletedMessageIds,
      initMessages,
      messages,
      removeMessage,
      removeMessageByUserId,
      sentMessageIds,
      // chat Actions
      actions,
      chatUserRole,
      hasConnectionError,
      isConnecting,
      sendAttemptError,
      isModerator,
      startPoll,
      endPoll,
      deletedMessage,
      setDeletedMessage
    }),
    [
      actions,
      addMessage,
      chatUserRole,
      hasConnectionError,
      initMessages,
      isConnecting,
      messages,
      removeMessage,
      removeMessageByUserId,
      sendAttemptError,
      isModerator,
      startPoll,
      endPoll,
      deletedMessage,
      setDeletedMessage
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useChat = () => useContextHook(Context);
