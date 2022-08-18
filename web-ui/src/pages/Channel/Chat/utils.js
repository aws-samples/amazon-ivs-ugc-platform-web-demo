import { ENABLE_CHAT_DEBUG_MESSAGES } from '../../../constants';

const noop = () => {};

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
