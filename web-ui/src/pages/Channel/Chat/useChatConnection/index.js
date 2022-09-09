import { useCallback, useEffect, useRef, useState } from 'react';

import { channel as $channelContent } from '../../../../content';
import { CHAT_TOKEN_REFRESH_DELAY_OFFSET } from '../../../../constants';
import {
  SEND_ERRORS,
  closeSocket,
  createSocket,
  requestChatToken
} from './utils';
import { ivsChatWebSocketEndpoint } from '../../../../api/utils';
import { retryWithBackoff } from '../../../../utils';
import { useChannel } from '../../../../contexts/Channel';
import { useChatMessages } from '../../../../contexts/ChatMessages';
import { useNotif } from '../../../../contexts/Notification';
import { useUser } from '../../../../contexts/User';
import useChatActions from './useChatActions';

const $content = $channelContent.chat;

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
const useChatConnection = (eventHandlers) => {
  const { channelData, refreshChannelData } = useChannel();
  const { username: chatRoomOwnerUsername, isViewerBanned } = channelData || {};
  const { addMessage } = useChatMessages();
  const { isSessionValid } = useUser();
  const { notifyError, dismissNotif } = useNotif();
  const chatCapabilities = useRef([]);

  // Connection State
  const [connectionReadyState, setConnectionReadyState] = useState();
  const [didConnectionCloseCleanly, setDidConnectionCloseCleanly] = useState();
  const [hasConnectionError, setHasConnectionError] = useState();
  const [sendError, setSendError] = useState();
  const isConnectionOpen = connectionReadyState === WebSocket.OPEN;
  const isInitializingConnection = useRef(false);
  const isRetryingConnection = useRef(false);
  const cancelConnectionRetry = useRef(false);
  const refreshTokenTimeoutId = useRef();
  const connection = useRef();
  const isConnecting =
    isInitializingConnection.current || connectionReadyState === 0;

  // Chat Actions
  const {
    banUser,
    chatUserRole,
    deleteMessage,
    sendMessage,
    unbanUser,
    updateUserRole
  } = useChatActions({ chatCapabilities, isConnectionOpen, connection });

  // Handlers
  const onOpen = useCallback(() => {
    setConnectionReadyState(WebSocket.OPEN);
    updateUserRole();
    dismissNotif();
  }, [dismissNotif, updateUserRole]);

  const onClose = useCallback(
    (event) => {
      connection.current = null;
      chatCapabilities.current = [];
      clearTimeout(refreshTokenTimeoutId.current);
      setConnectionReadyState(WebSocket.CLOSED);
      setDidConnectionCloseCleanly(event.wasClean);
      updateUserRole();
    },
    [updateUserRole]
  );

  const onMessage = useCallback(
    (event) => {
      const data = JSON.parse(event.data);
      const { Type: eventType } = data;

      switch (eventType) {
        case 'MESSAGE': {
          // Handle received message
          addMessage(data);
          setSendError(null);
          break;
        }
        case 'EVENT':
          // Handle received event
          const { Attributes, EventName } = data;

          switch (EventName) {
            case 'aws:DISCONNECT_USER': {
              const handleUserDisconnect = eventHandlers.handleUserDisconnect;
              handleUserDisconnect(Attributes.UserId);
              break;
            }
            case 'aws:DELETE_MESSAGE': {
              const handleDeleteMessage = eventHandlers.handleDeleteMessage;
              handleDeleteMessage(Attributes.MessageID);
              break;
            }
            case 'app:DELETE_USER_MESSAGES': {
              const handleDeleteUserMessages =
                eventHandlers.handleDeleteUserMessages;
              handleDeleteUserMessages(Attributes.UserId);
              break;
            }
            default: // Ignore events with unknown event names
          }

          break;
        case 'ERROR':
          // Handle received error
          console.log('Received Error:', data);

          if (Object.values(SEND_ERRORS).indexOf(data['ErrorMessage']) > -1) {
            setSendError({
              message: data['ErrorMessage']
            });
          }
          break;
        default:
          console.error('Unknown event received:', data);
      }
    },
    [
      addMessage,
      eventHandlers.handleDeleteMessage,
      eventHandlers.handleDeleteUserMessages,
      eventHandlers.handleUserDisconnect
    ]
  );

  // Connection helpers
  const retryConnectionWithBackoff = useCallback(
    async (connectFn, error, reasonId, maxRetries = 7) => {
      if (cancelConnectionRetry.current) {
        cancelConnectionRetry.current = false;
        isRetryingConnection.current = false;
        return;
      }

      if (isRetryingConnection.current) {
        throw error; // Starts the next retry attempt in the backoff sequence
      }

      isRetryingConnection.current = true;

      try {
        return await retryWithBackoff({
          promiseFn: connectFn,
          maxRetries,
          onRetry: (retryAttempt) =>
            console.warn(
              `Retrying connection (attempt: ${retryAttempt}${
                reasonId ? `, reason: ${reasonId}` : ''
              })...`
            ),
          onSuccess: () => (isRetryingConnection.current = false),
          onFailure: () => {
            isRetryingConnection.current = false;
            isInitializingConnection.current = false;
            notifyError($content.notifications.error.error_loading_chat, false);
            setHasConnectionError(true);
          }
        });
      } catch (err) {
        console.error(
          'Failed to establish a connection with the WebSocket service.',
          err
        );
      }
    },
    [notifyError]
  );

  const cancelRetryConnectionWithBackoff = useCallback(() => {
    if (isRetryingConnection.current) {
      cancelConnectionRetry.current = true;
    }
  }, []);

  const disconnect = useCallback(() => {
    closeSocket(connection.current);
    clearTimeout(refreshTokenTimeoutId.current);
    refreshChannelData();
    connection.current = null;
    refreshTokenTimeoutId.current = null;
  }, [refreshChannelData]);

  const connect = useCallback(async () => {
    if (
      isViewerBanned !== false ||
      !chatRoomOwnerUsername ||
      (isInitializingConnection.current && !isRetryingConnection.current)
    )
      return;

    // Clean up previous connection resources
    if (connection.current) disconnect();
    isInitializingConnection.current = true;
    setDidConnectionCloseCleanly(undefined);
    setHasConnectionError(false);

    // Request a new chat token
    const { token, sessionExpirationTime, error, capabilities } =
      await requestChatToken(chatRoomOwnerUsername);
    if (error)
      return retryConnectionWithBackoff(connect, error, 'token request');

    // Create a new WebSocket connection
    const handlers = { onMessage, onOpen, onClose };
    const socket = createSocket(ivsChatWebSocketEndpoint, token, handlers);
    if (!socket)
      return retryConnectionWithBackoff(
        connect,
        new Error(),
        'socket creation'
      );

    // Refresh the chat token and reconnect 30s before the current session expires
    const tokenRefreshDelay =
      new Date(sessionExpirationTime).getTime() -
      Date.now() -
      CHAT_TOKEN_REFRESH_DELAY_OFFSET;
    refreshTokenTimeoutId.current = setTimeout(connect, tokenRefreshDelay);

    // Update the state with the new socket connection and readyState
    connection.current = socket;
    chatCapabilities.current = capabilities;
    setConnectionReadyState(socket.readyState);

    isInitializingConnection.current = false;
  }, [
    chatRoomOwnerUsername,
    disconnect,
    isViewerBanned,
    onClose,
    onMessage,
    onOpen,
    retryConnectionWithBackoff
  ]);

  // Initialize connection
  useEffect(() => {
    connect();

    return disconnect;
  }, [connect, disconnect, isSessionValid]);

  // Reconnect on dirty close
  useEffect(() => {
    let reconnectTimeoutId;

    if (didConnectionCloseCleanly === false) {
      reconnectTimeoutId = setTimeout(connect, 1000); // Try to reconnect every 1 second
    }

    return () => clearTimeout(reconnectTimeoutId);
  }, [connect, didConnectionCloseCleanly]);

  // Cancel the retry backoff sequence on unmount
  useEffect(
    () => cancelRetryConnectionWithBackoff,
    [cancelRetryConnectionWithBackoff]
  );

  return {
    banUser,
    chatUserRole,
    deleteMessage,
    hasConnectionError,
    isConnecting,
    sendError,
    sendMessage,
    unbanUser
  };
};

export default useChatConnection;
