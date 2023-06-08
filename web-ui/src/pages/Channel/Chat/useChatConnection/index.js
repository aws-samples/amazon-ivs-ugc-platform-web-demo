import { useCallback, useEffect, useRef, useState } from 'react';
import { ChatRoom } from 'amazon-ivs-chat-messaging';

import { channel as $channelContent } from '../../../../content';
import { CHAT_USER_ROLE, requestChatToken } from './utils';
import { ivsChatWebSocketRegionOrUrl } from '../../../../api/utils';
import { MAX_RECONNECT_ATTEMPTS, CHAT_LOG_LEVELS } from '../../../../constants';
import { useChannel } from '../../../../contexts/Channel';
import { useChatMessages } from '../../../../contexts/ChatMessages';
import { useNotif } from '../../../../contexts/Notification';
import { useUser } from '../../../../contexts/User';
import useChatActions from './useChatActions';

const $content = $channelContent.chat;
const { INFO: info, DEBUG: debug } = CHAT_LOG_LEVELS;

/**
 * @typedef {Object} ChatEventHandlers
 * @property {Function} handleDeleteMessage
 * @property {Function} handleDeleteUserMessages
 * @property {Function} handleUserDisconnect
 */

/**
 * Initializes and controls a connection to the Amazon IVS Chat Messaging API
 * @param {ChatEventHandlers} eventHandlers
 */
const useChatConnection = (eventHandlers = {}) => {
  const { channelData, refreshChannelData } = useChannel();
  const { username: chatRoomOwnerUsername, isViewerBanned } = channelData || {};
  const { addMessage } = useChatMessages();
  const { isSessionValid, userData } = useUser();
  const { username: ownUsername } = userData || {};
  const { notifyError, dismissNotif } = useNotif();
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

        const handleUserDisconnect = eventHandlers.handleUserDisconnect;
        handleUserDisconnect(bannedUserId);

        if (!bannedUserId.includes(trackingId)) {
          const handleDeleteUserMessages =
            eventHandlers.handleDeleteUserMessages;

          handleDeleteUserMessages(bannedUserId);
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
        const handleDeleteMessage = eventHandlers.handleDeleteMessage;

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
    eventHandlers.handleDeleteMessage,
    eventHandlers.handleUserDisconnect,
    eventHandlers.handleDeleteUserMessages,
    eventHandlers,
    userData
  ]);

  return {
    actions,
    chatUserRole,
    hasConnectionError,
    isConnecting,
    sendAttemptError,
    isModerator
  };
};

export default useChatConnection;
