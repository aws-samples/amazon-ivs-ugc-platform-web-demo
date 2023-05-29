import { getChatToken } from '../../../../api/channel';

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

export const requestChatToken = async (
  chatRoomOwnerUsername,
  abortControllerSignal
) => {
  const { result: { token, sessionExpirationTime, capabilities } = {}, error } =
    await getChatToken(chatRoomOwnerUsername, abortControllerSignal);

  if (error && error.name !== 'AbortError') {
    console.error('Error requesting chat token:', error);

    return { error };
  }

  return { token, sessionExpirationTime, capabilities };
};
