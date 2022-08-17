import { ENABLE_CHAT_DEBUG_MESSAGES } from '../../../constants';

const logDebugMessage = (type, ...data) => {
  if (ENABLE_CHAT_DEBUG_MESSAGES) {
    console[type](...data);
  }
};

const noop = () => {};

export const createSocket = (endpoint, token, handlers) => {
  let connection;
  const {
    onMessage = noop,
    onOpen = noop,
    onClose = noop,
    onError = noop
  } = handlers;

  try {
    connection = new WebSocket(endpoint, token);

    setOnMessageListener(connection, onMessage);

    connection.onopen = (event) => {
      console.info('Connected to the chat room', event);
      onOpen();
    };

    connection.onclose = (event) => {
      if (!event.wasClean) {
        logDebugMessage(
          'error',
          '[WebSocket onclose event] Connection died, reconnecting...'
        );

        setTimeout(() => createSocket(endpoint, token, handlers), 100);
      }

      console.info('Disconnected from the chat room', event);
      onClose();
    };

    connection.onerror = (error) => {
      logDebugMessage('error', '[WebSocket onerror event]', error);
      onError();
    };
  } catch (err) {
    logDebugMessage('error', `[WebSockets exception] ${err.message}`);
  }

  return connection;
};

const setOnMessageListener = (socket, onMessage) => {
  const listenerDebugOn = (event) => {
    try {
      const data = JSON.parse(event.data);
      logDebugMessage(
        'log',
        '[WebSocket message] Data received from server:',
        data
      );
      onMessage(data);
    } catch (err) {
      logDebugMessage('log', err);
    }
  };

  const listenerDebugOff = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (err) {
      logDebugMessage('error', err);
    }
  };

  socket.onmessage = ENABLE_CHAT_DEBUG_MESSAGES
    ? listenerDebugOn
    : listenerDebugOff;
};

export const closeSocket = (socket) => {
  if (!socket) return;

  // Check if the current state of the connection is CONNECTING (0)
  // In that case wait before closing the connection
  if (socket.readyState === 0) {
    setTimeout(() => closeSocket(socket), 1000);
  } else {
    socket.close(1000, 'Work complete');
  }
};
