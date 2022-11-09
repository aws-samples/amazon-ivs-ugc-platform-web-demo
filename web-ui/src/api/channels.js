import { apiBaseUrl, authFetch, getCurrentSession, unauthFetch } from './utils';

export const getUserChannelData = async (username) => {
  const { result: session } = await getCurrentSession();
  const isSessionValid = !!session;
  const _fetch = isSessionValid ? authFetch : unauthFetch;

  return await _fetch({ url: `${apiBaseUrl}/channels/${username}` });
};
