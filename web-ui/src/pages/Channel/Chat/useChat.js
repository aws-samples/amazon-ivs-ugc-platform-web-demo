import { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { CHAT_TOKEN_REFRESH_DELAY_OFFSET } from '../../../constants';
import {
  CHAT_CAPABILITY,
  CHAT_USER_ROLE,
  closeSocket,
  createSocket,
  requestChatToken
} from './utils';
import { ivsChatWebSocketEndpoint } from '../../../api/utils';
import { retryWithBackoff } from '../../../utils';
import { useUser } from '../../../contexts/User';

/**
 * @typedef {('VIEWER'|'SENDER'|'MODERATOR'|undefined)} ChatUserRole
 */

const useChat = (chatRoomOwnerUsername) => {
  const { isSessionValid } = useUser();
  const [messages, setMessages] = useState([]);
  const chatCapabilities = useRef([]);

  /** @type {[ChatUserRole, Function]} */
  const [chatUserRole, setChatUserRole] = useState();

  // Connection State
  const [connectionReadyState, setConnectionReadyState] = useState();
  const [didConnectionCloseCleanly, setDidConnectionCloseCleanly] = useState();
  const isConnectionOpen = connectionReadyState === WebSocket.OPEN;
  const isInitializingConnection = useRef(false);
  const isRetryingConnection = useRef(false);
  const refreshTokenTimeoutId = useRef();
  const connection = useRef();

  const updateUserRole = useCallback(() => {
    let type;

    // Returns true if the user's chat capabilities contain all of the given required capabilities
    const hasPermission = (requiredCapabilities) =>
      requiredCapabilities.every((reqCap) =>
        chatCapabilities.current.includes(reqCap)
      );

    switch (true) {
      case hasPermission([
        CHAT_CAPABILITY.DISCONNECT_USER,
        CHAT_CAPABILITY.DELETE_MESSAGE
      ]): {
        type = CHAT_USER_ROLE.MODERATOR;
        break;
      }
      case hasPermission([CHAT_CAPABILITY.SEND_MESSAGE]): {
        type = CHAT_USER_ROLE.SENDER;
        break;
      }
      case hasPermission([CHAT_CAPABILITY.VIEW_MESSAGE]): {
        type = CHAT_USER_ROLE.VIEWER;
        break;
      }
      default: // exhaustive
    }

    setChatUserRole(type);
  }, []);

  // Actions
  const send = (action, data) => {
    try {
      if (!isConnectionOpen)
        throw new Error(
          'Message or event failed to send because there is no open socket connection!'
        );

      connection.current.send(
        JSON.stringify({
          Action: action,
          RequestId: uuidv4(),
          ...data
        })
      );
    } catch (error) {
      console.error(error);
    }
  };

  const sendMessage = (msg) => {
    if (
      ![CHAT_USER_ROLE.SENDER, CHAT_USER_ROLE.MODERATOR].includes(chatUserRole)
    ) {
      console.error(
        'You do not have permission to send messages to this channel!'
      );
      return;
    }

    send('SEND_MESSAGE', {
      Content: msg.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    });
  };

  // Handlers
  const onOpen = useCallback(() => {
    setConnectionReadyState(WebSocket.OPEN);
    updateUserRole();
  }, [updateUserRole]);

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

  const onMessage = useCallback((event) => {
    const data = JSON.parse(event.data);
    const { Type: eventType } = data;

    switch (eventType) {
      case 'MESSAGE': {
        // Handle received message
        setMessages((prevMessages) => [...prevMessages, data]);
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

  // Connection helpers

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

  const disconnect = useCallback(() => {
    closeSocket(connection.current);
    clearTimeout(refreshTokenTimeoutId.current);
    connection.current = null;
  }, []);

  const connect = useCallback(async () => {
    if (isInitializingConnection.current && !isRetryingConnection.current)
      return;

    // Clean up previous connection resources
    disconnect();
    setDidConnectionCloseCleanly(undefined);
    isInitializingConnection.current = true;

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

  return { chatUserRole, messages, sendMessage };
};

export default useChat;
