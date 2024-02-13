import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useContext
} from 'react';
import PropTypes from 'prop-types';
import { useLocation, useNavigate } from 'react-router-dom';

import { channel as $channelContent } from '../content';
import { useUser } from './User';
import useContextHook from './useContextHook';
import { useChannel } from './Channel';
import { useNotif } from './Notification';
import useChatActions from '../pages/Channel/Chat/useChatConnection/useChatActions';
import {
  CHAT_LOG_LEVELS,
  MAX_RECONNECT_ATTEMPTS,
  STREAM_ACTION_NAME
} from '../constants';
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
import { StageContext } from '../pages/StageManager/contexts/StageContext';

const {
  SEND_MESSAGE,
  START_POLL,
  END_POLL,
  SUBMIT_VOTE,
  SEND_VOTE_STATS,
  HEART_BEAT
} = CHAT_MESSAGE_EVENT_TYPES;

const REQUEST_STATUS = {
  REQUEST_JOIN: 'REQUEST_JOIN',
  REQUEST_APPROVED: 'REQUEST_APPROVED',
  REQUEST_REJECTED: 'REQUEST_REJECTED',
  REQUEST_WITHDRAWN: 'REQUEST_WITHDRAWN',
  NOTIFY_USER_JOIN: 'NOTIFY_USER_JOIN',
  NOTIFY_USER_LEAVE: 'NOTIFY_USER_LEAVE',
  NOTIFY_ALL_USERS: 'NOTIFY_ALL_USERS'
};

const CANVAS_EVENTS = {
  DRAW_EVENTS: 'DRAW_EVENTS',
  OPEN_ANNOTATION_CANVAS: 'OPEN_ANNOTATION_CANVAS',
  CLOSE_ANNOTATION_CANVAS: 'CLOSE_ANNOTATION_CANVAS',
  OPEN_COLLABORATION_CANVAS: 'OPEN_CO_CANVAS'
};
const {
  REQUEST_JOIN,
  REQUEST_APPROVED,
  REQUEST_REJECTED,
  REQUEST_WITHDRAWN,
  NOTIFY_USER_JOIN,
  NOTIFY_USER_LEAVE,
  NOTIFY_ALL_USERS
} = REQUEST_STATUS;
const {
  DRAW_EVENTS,
  OPEN_ANNOTATION_CANVAS,
  CLOSE_ANNOTATION_CANVAS,
  OPEN_COLLABORATION_CANVAS
} = CANVAS_EVENTS;
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

  const { notifyError, dismissNotif } = useNotif();
  const retryConnectionAttemptsCounterRef = useRef(0);
  const chatCapabilities = useRef([]);
  const { state } = useLocation();

  // console.log("state", state);
  const { username: chatRoomOwner, isViewerBanned = false } = channelData || {};
  const chatRoomOwnerUsername = state?.hostUserName
    ? state?.hostUserName
    : chatRoomOwner;
  // Connection State
  const [hasConnectionError, setHasConnectionError] = useState();
  const [sendAttemptError, setSendAttemptError] = useState();
  const connection = useRef(null);
  const [room, setRoom] = useState(null);
  const isConnectionOpenRef = useRef(false);

  const isInitializingConnection = useRef(false);
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
  const [joinRequestStatus, setJoinRequestStatus] = useState(null);
  const [stageData, setStageData] = useState();
  const [isStageOwner, setIsStageOwner] = useState(false);
  const [participantList, setParticipantList] = useState([]);
  const [drawingEventHandler, setDrawingEventHandler] = useState(null);
  const [annotationCanvasState, setAnnotationCanvasState] = useState({
    open: false,
    aspectRatio:0
  });

  const isModerator = chatUserRole === CHAT_USER_ROLE.MODERATOR;

  // Poll Stream Action
  const {
    updatePollData,
    votes,
    hasPollEnded,
    resetPollProps,
    isActive,
    clearPollLocalStorage,
    setSelectedOption,
    selectedOption,
    showFinalResults,
    duration,
    question,
    expiry,
    startTime,
    noVotesCaptured,
    tieFound,
    savedPollData,
    saveVotesToLocalStorage,
    savePollDataToLocalStorage,
    dispatchPollState,
    endPollAndResetPollProps
  } = usePoll();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { stageInfo } = useContext(StageContext);
  const isStreamManagerPage = pathname === '/manager';

  const startPoll = useCallback(
    async (pollStreamActionData) => {
      const attributes = {
        eventType: START_POLL,
        pollStreamActionData: JSON.stringify(pollStreamActionData)
      };

      await actions.sendMessage(START_POLL, attributes);
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
    },
    [actions]
  );

  const sendHeartBeat = useCallback(() => {
    if (
      isModerator &&
      isActive &&
      !showFinalResults &&
      !noVotesCaptured &&
      !tieFound
    ) {
      actions.sendMessage(HEART_BEAT, {
        eventType: HEART_BEAT,
        updatedVotes: JSON.stringify(votes),
        duration: JSON.stringify(duration),
        question: JSON.stringify(question),
        expiry: JSON.stringify(expiry),
        startTime: JSON.stringify(startTime),
        voters: JSON.stringify(savedPollData?.voters || {})
      });
    }
  }, [
    actions,
    duration,
    expiry,
    isActive,
    isModerator,
    noVotesCaptured,
    question,
    savedPollData?.voters,
    showFinalResults,
    startTime,
    tieFound,
    votes
  ]);

  useEffect(() => {
    let heartBeatIntervalId = null;
    if (isActive) {
      heartBeatIntervalId = setInterval(() => {
        sendHeartBeat();
      }, 4000);
    }

    return () => {
      if (heartBeatIntervalId !== null) {
        clearInterval(heartBeatIntervalId);
      }
    };
  }, [isActive, sendHeartBeat]);

  const requestJoin = useCallback(async () => {
    const attributes = {
      eventType: REQUEST_JOIN,
      userId: userData.id,
      requestedUsername: userData.username
    };
    await actions.sendMessage(REQUEST_JOIN, attributes);
    return true;
  }, [actions]);
  // console.log('stageData', stageData);
  const requestAprrove = useCallback(async () => {
    // console.log('stageData', stageData);
    const attributes = {
      eventType: REQUEST_APPROVED,
      groupId: stageData?.groupId,
      userId: joinRequestStatus?.userId,
      requestedUsername: joinRequestStatus?.requestedUsername,
      hostUserName: userData?.username
    };
    await actions.sendMessage(REQUEST_APPROVED, attributes);

    return true;
  }, [actions, stageData, joinRequestStatus]);

  const requestReject = useCallback(async () => {
    const attributes = {
      eventType: REQUEST_REJECTED
    };
    await actions.sendMessage(REQUEST_REJECTED, attributes);
    return true;
  }, [actions]);

  const requestWithdraw = useCallback(async () => {
    const attributes = {
      eventType: REQUEST_WITHDRAWN
    };
    await actions.sendMessage(REQUEST_WITHDRAWN, attributes);
    return true;
  }, [actions]);

  const notifyUserJoin = useCallback(async () => {
    console.log('Notify user join called');
    const attributes = {
      eventType: NOTIFY_USER_JOIN,
      userId: userData.id,
      joinedUsername: userData.username
    };
    await actions.sendMessage(NOTIFY_USER_JOIN, attributes);
    return true;
  }, [actions]);

  const notifyUserLeave = useCallback(async () => {
    console.log('Notify user leave called');
    const attributes = {
      eventType: NOTIFY_USER_LEAVE,
      userId: userData?.id,
      leftUsername: userData.username
    };
    await actions.sendMessage(NOTIFY_USER_LEAVE, attributes);
    return true;
  }, [actions, userData]);

  const notifyAllUsers = useCallback(
    async (list) => {
      console.log('Notify all users called', list);
      const attributes = {
        eventType: NOTIFY_ALL_USERS,
        participantList: list.join(',')
      };
      await actions.sendMessage(NOTIFY_ALL_USERS, attributes);
      return true;
    },
    [actions]
  );

  const sendDrawEvents = useCallback(
    async (payload) => {
      // console.log('stageData', stageData);
      const attributes = {
        eventType: DRAW_EVENTS,
        userId: userData?.id,
        drawEventsData: payload
      };
      await actions.sendMessage(DRAW_EVENTS, attributes);

      return true;
    },
    [actions]
  );

  const startSSWithAnnots = useCallback(
    async (payload) => {
      // console.log('stageData', stageData);
      const attributes = {
        eventType: OPEN_ANNOTATION_CANVAS,
        userId: userData?.id,
        participantId : payload
        // drawEventsData:payload
      };
      console.log('participantId',payload)
      await actions.sendMessage(OPEN_ANNOTATION_CANVAS, attributes);

      return true;
    },
    [actions]
  );

  const stopSSWithAnnots = useCallback(
    async (payload) => {
      // console.log('stageData', stageData);
      const attributes = {
        eventType: CLOSE_ANNOTATION_CANVAS,
        userId: userData?.id
        // drawEventsData:payload
      };
      await actions.sendMessage(CLOSE_ANNOTATION_CANVAS, attributes);

      return true;
    },
    [actions]
  );

  const receiveDrawEvents = useCallback((handler) => {
    setDrawingEventHandler(() => handler);
  }, []);

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
    refreshChannelData();
    notifyUserLeave();
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

    room.logLevel = process.env.REACT_APP_STAGE === 'prod' ? info : debug;
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
      notifyUserJoin();
      dismissNotif();
    });

    const unsubscribeOnDisconnect = room.addListener('disconnect', () => {
      isConnectionOpenRef.current = false;
      connection.current = null;
      setRoom(null);
      // notifyUserLeave()
      chatCapabilities.current = [];

      updateUserRole();
    });

    const unsubscribeOnUserDisconnect = room.addListener(
      'userDisconnect',
      (event) => {
        const { trackingId } = userData;
        const { userId: bannedUserId } = event;

        handleUserDisconnect(bannedUserId);
        // notifyUserLeave()
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
          pollStreamActionData = undefined,
          eventType = undefined,
          voter = undefined,
          option = undefined,
          userId = undefined,
          groupId = undefined,
          requestedUsername = undefined,
          hostUserName = undefined,
          joinedUsername = undefined,
          participantList = undefined,
          leftUsername = undefined,
          drawEventsData = undefined,
          participantId=undefined
        }
      } = message;
      switch (eventType) {
        case HEART_BEAT:
          if ((isModerator && isStreamManagerPage) || hasPollEnded) return;

          const date = JSON.parse(message.attributes.startTime);
          const currentTime = Date.now();
          const delay = (currentTime - date) / 1000;

          updatePollData({
            duration: Number(JSON.parse(message.attributes.duration)),
            question: JSON.parse(message.attributes.question),
            votes: JSON.parse(message.attributes.updatedVotes),
            isActive: true,
            expiry: JSON.parse(message.attributes.expiry),
            startTime: JSON.parse(message.attributes.startTime),
            delay
          });

          const votersList = JSON.parse(message.attributes.voters);

          if (!selectedOption && userData?.trackingId in votersList) {
            const savedVote = votersList[userData?.trackingId];
            if (savedVote) {
              setSelectedOption(savedVote);
              dispatchPollState({ isVoting: false });
            }
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

            saveVotesToLocalStorage(currentVotes, { [voter]: option });

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
          } = JSON.parse(pollStreamActionData);

          if (isModerator && isStreamManagerPage) {
            savePollDataToLocalStorage({
              duration,
              expiry,
              startTime,
              question,
              votes: options,
              voters: {},
              isActive: true,
              name: STREAM_ACTION_NAME.POLL
            });
          }

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
          endPollAndResetPollProps();
          break;
        case REQUEST_JOIN:
          setJoinRequestStatus({
            status: 'REQUEST_JOIN',
            userId,
            requestedUsername
          });
          break;

        case REQUEST_APPROVED:
          setJoinRequestStatus({
            status: 'REQUEST_APPROVED',
            userId,
            requestedUsername
          });
          userData?.id === userId &&
            navigate(
              '/classroom',
              {
                state: {
                  joinAsParticipant: true,
                  groupId: groupId,
                  hostUserName: hostUserName
                }
              },
              {}
            );

          break;

        case REQUEST_REJECTED:
          setJoinRequestStatus({
            status: 'REQUEST_REJECTED',
            userId,
            requestedUsername
          });
          setTimeout(() => {
            setJoinRequestStatus(null);
          }, 5000);
          break;
        case REQUEST_WITHDRAWN:
          setJoinRequestStatus({
            status: 'REQUEST_WITHDRAWN',
            userId,
            requestedUsername
          });
          setJoinRequestStatus(null);
          break;
        case SEND_MESSAGE:
          addMessage(message);
          break;
        case NOTIFY_USER_JOIN:
          if (isModerator) {
            let list = [];
            const tempList = participantList;
            if (participantList) {
              setParticipantList([...tempList, joinedUsername]);
              list = [...tempList, joinedUsername];
            } else {
              setParticipantList([userData.username, joinedUsername]);
              list = [userData.username, joinedUsername];
            }
            notifyAllUsers(list);
          }
          break;
        case NOTIFY_ALL_USERS:
          const list = participantList.split(',');
          setParticipantList(list);
          break;
        case NOTIFY_USER_LEAVE:
          if (isModerator) {
            let list = [];
            const tempList = participantList.filter(
              (item) => item !== leftUsername
            );
            setParticipantList(tempList);
            notifyAllUsers(tempList);
          }
          break;
        case DRAW_EVENTS:
          console.log(
            'DRAW_USER',
            drawEventsData,
            userId,
            userData.id,
            drawingEventHandler
          );
          if (drawingEventHandler && userId !== userData.id) {
            drawingEventHandler(drawEventsData);
          }
          break;
        case OPEN_ANNOTATION_CANVAS:
          console.log('participantId',participantId)
          setAnnotationCanvasState({ open: true, userId ,participantId});
          break;
        case CLOSE_ANNOTATION_CANVAS:
          setAnnotationCanvasState({ open: false, userId });
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
    selectedOption,
    setSelectedOption,
    saveVotesToLocalStorage,
    savedPollData,
    clearPollLocalStorage,
    isStreamManagerPage,
    savePollDataToLocalStorage,
    dispatchPollState,
    endPollAndResetPollProps,
    stageData,
    setStageData,
    isStageOwner,
    setIsStageOwner,
    annotationCanvasState,
    drawingEventHandler
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
      setDeletedMessage,
      requestJoin,
      requestAprrove,
      requestReject,
      requestWithdraw,
      notifyUserJoin,
      userData,
      joinRequestStatus,
      stageData,
      setStageData,
      isStageOwner,
      setIsStageOwner,
      participantList,
      sendDrawEvents,
      receiveDrawEvents,
      annotationCanvasState,
      startSSWithAnnots,
      stopSSWithAnnots
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
      requestJoin,
      requestAprrove,
      requestReject,
      requestWithdraw,
      notifyUserJoin,
      userData,
      deletedMessage,
      setDeletedMessage,
      joinRequestStatus,
      stageData,
      setStageData,
      isStageOwner,
      setIsStageOwner,
      participantList,
      sendDrawEvents,
      receiveDrawEvents,
      annotationCanvasState,
      startSSWithAnnots,
      stopSSWithAnnots
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useChat = () => useContextHook(Context);
