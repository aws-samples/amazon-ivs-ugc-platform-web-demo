import { getChatToken } from '../../../../api/channel';
import { ENABLE_CHAT_DEBUG_MESSAGES } from '../../../../constants';
import { noop } from '../../../../utils';

export const CHAT_CAPABILITY = {
  VIEW_MESSAGE: 'VIEW_MESSAGE',
  SEND_MESSAGE: 'SEND_MESSAGE',
  DISCONNECT_USER: 'DISCONNECT_USER',
  DELETE_MESSAGE: 'DELETE_MESSAGE'
};
export const CHAT_USER_ROLE = {
  VIEWER: 'VIEWER',
  SENDER: 'SENDER',
  MODERATOR: 'MODERATOR'
};

export const SEND_ERRORS = {
  RATE_LIMIT_EXCEEDED: 'rate limit exceeded',
  MAX_LENGTH_EXCEEDED: 'Message exceeds maximum length'
};

export const requestChatToken = async (chatRoomOwnerUsername) => {
  const { result: { token, sessionExpirationTime, capabilities } = {}, error } =
    await getChatToken(chatRoomOwnerUsername);

  if (error) {
    console.error('Error requesting chat token:', error);
    return { error };
  }

  return { token, sessionExpirationTime, capabilities };
};

export const createSocket = (endpoint, token, handlers) => {
  const {
    onMessage = noop,
    onOpen = noop,
    onClose = noop,
    onError = noop
  } = handlers || {};
  let connection;

  try {
    connection = new WebSocket(endpoint, token);

    connection.onmessage = (event) => {
      logDebugMessage('info', 'Data received from server', event);
      onMessage(event);
    };

    connection.onopen = (event) => {
      logDebugMessage('info', 'Connected to the chat room', event);
      onOpen(event);
    };

    connection.onclose = (event) => {
      logDebugMessage('info', 'Disconnected from the chat room', event);
      onClose(event);
    };

    connection.onerror = (error) => {
      logDebugMessage('error', 'WebSocket Error', error);
      onError(error);
    };
  } catch (error) {
    logDebugMessage('error', 'WebSocket Exception', error);
  }

  return connection;
};

export const closeSocket = (socket) => {
  if (!socket) return;

  // Check if the current state of the connection is CONNECTING (0).
  // In that case wait before closing the connection.
  if (socket.readyState === 0) {
    setTimeout(() => closeSocket(socket), 1000);
  } else {
    socket.close(1000, 'Work complete');
  }
};

const logDebugMessage = (type, ...data) => {
  if (ENABLE_CHAT_DEBUG_MESSAGES) {
    console[type](...data);
  }
};
