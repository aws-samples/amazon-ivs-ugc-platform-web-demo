import { apiBaseUrl, authFetch, getCurrentSession, unauthFetch } from './utils';

export const getUserChannelData = async (username) => {
  const { result: session } = await getCurrentSession();
  const isSessionValid = !!session;
  const _fetch = isSessionValid ? authFetch : unauthFetch;

  return await _fetch({ url: `${apiBaseUrl}/user/channel/${username}` });
};

/**
 * @typedef {Object} ChatTokenData
 * @property {string} token
 * @property {string} tokenExpirationTime
 * @property {string} sessionExpirationTime
 *
 * @typedef {Object} ChatTokenResponse
 * @property {ChatTokenData} result
 * @property {Error} error
 */

/**
 * Requests an IVS chat token used to establish a connection with the IVS Chat Messaging API.
 *
 * If the user requesting the token is authenticated, then a private token will be requested
 * containing VIEW and SEND capabilities; otherwise, a public token will be requested
 * containing only the VIEW capability.
 *
 * @param {string} chatRoomOwnerUsername username of the owner for the chat room to which access is being requested
 * @returns {ChatTokenResponse}
 */
export const getChatToken = async (chatRoomOwnerUsername) => {
  const { result: session } = await getCurrentSession();
  const isSessionValid = !!session;
  const tokenType = isSessionValid ? 'private' : 'public';
  const _fetch = isSessionValid ? authFetch : unauthFetch;

  return await _fetch({
    method: 'POST',
    url: `${apiBaseUrl}/user/chatroom/token/${tokenType}/create`,
    body: { chatRoomOwnerUsername }
  });
};
