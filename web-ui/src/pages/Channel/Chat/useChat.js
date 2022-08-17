import { useCallback, useEffect, useRef, useState } from 'react';

import { getChatToken } from '../../../api/channel';
import { closeSocket, createSocket } from './utils';
import { ivsChatWebSocketEndpoint } from '../../../api/utils';

const useChat = (chatRoomOwnerUsername) => {
  const [connectionReadyState, setConnectionReadyState] = useState();
  const isConnectionOpen = connectionReadyState === WebSocket.OPEN;
  const isInitializingConnection = useRef(false);
  const connection = useRef();

  const requestToken = useCallback(async () => {
    const { result: { token } = {}, error: tokenError } = await getChatToken(
      chatRoomOwnerUsername
    );

    if (tokenError) {
      console.error('Error requesting chat token:', tokenError);
      return;
    }

    return token;
  }, [chatRoomOwnerUsername]);

  // Handlers
  const onOpen = useCallback(() => {
    setConnectionReadyState(WebSocket.OPEN);
    isInitializingConnection.current = false;
  }, []);

  const onClose = useCallback(() => {
    setConnectionReadyState(WebSocket.CLOSED);
    connection.current = null;
  }, []);

  const onError = useCallback((event) => {
    console.error('Chat room WebSocket error observed:', event);
  }, []);

  const onMessage = useCallback((data) => {
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

  useEffect(() => {
    const initConnection = async () => {
      isInitializingConnection.current = true;
      const token = await requestToken();
      const handlers = { onMessage, onOpen, onClose, onError };
      const socket = createSocket(ivsChatWebSocketEndpoint, token, handlers);

      if (socket) {
        setConnectionReadyState(socket.readyState);
        connection.current = socket;
      }
    };

    if (!isInitializingConnection.current && !connection.current) {
      initConnection();
    }

    return () => closeSocket(connection.current);
  }, [onClose, onError, onMessage, onOpen, requestToken]);

  return { isConnectionOpen };
};

export default useChat;
