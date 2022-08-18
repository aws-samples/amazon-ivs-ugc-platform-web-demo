import { useCallback, useEffect, useRef, useState } from 'react';

import { CHAT_TOKEN_REFRESH_DELAY_OFFSET } from '../../../constants';
import { createSocket, closeSocket } from './utils';
import { getChatToken } from '../../../api/channel';
import { ivsChatWebSocketEndpoint } from '../../../api/utils';
import { retryWithBackoff } from '../../../utils';
import { useUser } from '../../../contexts/User';

const requestChatToken = async (chatRoomOwnerUsername) => {
  const { result: { token, sessionExpirationTime } = {}, error } =
    await getChatToken(chatRoomOwnerUsername);

  if (error) {
    console.error('Error requesting chat token:', error);
    return { error };
  }

  return { token, sessionExpirationTime };
};

const useChat = (chatRoomOwnerUsername) => {
  const { isSessionValid } = useUser();
  const [connectionReadyState, setConnectionReadyState] = useState();
  const [didConnectionCloseCleanly, setDidConnectionCloseCleanly] = useState();
  const isConnectionOpen = connectionReadyState === WebSocket.OPEN;
  const isInitializingConnection = useRef(false);
  const isRetryingConnection = useRef(false);
  const refreshTokenTimeoutId = useRef();
  const connection = useRef();

  // Handlers
  const onOpen = useCallback(() => {
    setConnectionReadyState(WebSocket.OPEN);
  }, []);

  const onClose = useCallback((event) => {
    connection.current = null;
    clearTimeout(refreshTokenTimeoutId.current);
    setConnectionReadyState(WebSocket.CLOSED);
    setDidConnectionCloseCleanly(event.wasClean);
  }, []);

  const onMessage = useCallback((event) => {
    const data = JSON.parse(event.data);
    const { Type: eventType } = data;

    switch (eventType) {
      case 'MESSAGE': {
        // Handle received message
        console.log('Received Message:', data);
        break;
      }
      case 'EVENT':
        // Handle received event
        console.log('Received Event:', data);
        break;
      case 'ERROR':
        // Handle received error
        console.log('Received Error:', data);
        break;
      default:
        console.error('Unknown event received:', data);
    }
  }, []);

  const disconnect = useCallback(() => {
    closeSocket(connection.current);
    clearTimeout(refreshTokenTimeoutId.current);
    connection.current = null;
  }, []);

  const retryConnectionWithBackoff = useCallback(
    async (connectFn, error, reasonId, maxRetries = 7) => {
      if (isRetryingConnection.current) throw error;
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
          }
        });
      } catch (error) {
        console.error(
          'Failed to establish a connection with the WebSocket service.',
          error
        );
      }
    },
    []
  );

  const connect = useCallback(async () => {
    if (isInitializingConnection.current && !isRetryingConnection.current)
      return;

    // Clean up previous connection resources
    disconnect();
    setDidConnectionCloseCleanly(undefined);
    isInitializingConnection.current = true;

    // Request a new chat token
    const { token, sessionExpirationTime, error } = await requestChatToken(
      chatRoomOwnerUsername
    );
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
    setConnectionReadyState(socket.readyState);

    isInitializingConnection.current = false;
  }, [
    chatRoomOwnerUsername,
    disconnect,
    onClose,
    onMessage,
    onOpen,
    retryConnectionWithBackoff
  ]);

  // Initialize connection
  useEffect(() => {
    if (!chatRoomOwnerUsername) return;

    connect();

    return disconnect;
  }, [chatRoomOwnerUsername, connect, disconnect, isSessionValid]);

  // Reconnect on dirty close
  useEffect(() => {
    let reconnectTimeoutId;

    if (didConnectionCloseCleanly === false) {
      reconnectTimeoutId = setTimeout(connect, 1000); // Try to reconnect every 1 second
    }

    return () => clearTimeout(reconnectTimeoutId);
  }, [connect, didConnectionCloseCleanly]);

  return { isConnectionOpen };
};

export default useChat;
