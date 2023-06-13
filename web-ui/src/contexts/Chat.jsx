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
import { extractChannelIdfromChannelArn } from '../utils';

const $content = $channelContent.chat;
const { INFO: info, DEBUG: debug } = CHAT_LOG_LEVELS;

const Context = createContext(null);
Context.displayName = 'ChatMessages';

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
  const { username: chatRoomOwnerUsername, isViewerBanned } = channelData || {};
  const { notifyError, notifySuccess, dismissNotif } = useNotif();
  const retryConnectionAttemptsCounterRef = useRef(0);
  const chatCapabilities = useRef([]);

  // Connection State
  const [hasConnectionError, setHasConnectionError] = useState();
  const [sendAttemptError, setSendAttemptError] = useState();
  const [room, setRoom] = useState(null);
  const isConnectionOpenRef = useRef(false);

  const isInitializingConnection = useRef(false);
  const isRetryingConnection = useRef(false);
  const connection = useRef();
  const abortControllerRef = useRef();
  const isConnecting = isInitializingConnection.current;

  // Chat Actions
  const { actions, chatUserRole, updateUserRole } = useChatActions({
    chatCapabilities,
    isConnectionOpen: isConnectionOpenRef.current,
    connection,
    setSendAttemptError
  });

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
      (!ownUsername && isSessionValid) ||
      (isInitializingConnection.current && !isRetryingConnection.current)
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
  }, [
    chatRoomOwnerUsername,
    disconnect,
    isSessionValid,
    isViewerBanned,
    notifyError,
    ownUsername
  ]);

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
      if (deletedMessageIds.current.includes(messageId)) {
        notifySuccess($content.notifications.success.message_removed);
      } else if (sentMessageIds.current.includes(messageId)) {
        notifyError($content.notifications.error.your_message_was_removed);
      }
    },
    [
      deletedMessageIds,
      notifyError,
      notifySuccess,
      removeMessage,
      sentMessageIds
    ]
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

  // Initialize connection
  useEffect(() => {
    connect();

    return disconnect;
  }, [connect, disconnect, isSessionValid]);

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
      addMessage(message);
    });

    const unsubscribeOnMessageDelete = room.addListener(
      'messageDelete',
      (deletedMessage) => {
        const {
          attributes: { MessageID }
        } = deletedMessage;

        handleDeleteMessage(MessageID);
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
    removeMessageByUserId
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
      isModerator
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
      isModerator
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useChat = () => useContextHook(Context);
