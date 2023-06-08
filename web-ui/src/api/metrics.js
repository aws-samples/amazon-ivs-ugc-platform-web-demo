import { apiBaseUrl, authFetch } from './utils';

export const getStreamSessions = async (channelResourceId, nextToken = '') =>
  await authFetch({
    url: `${apiBaseUrl}/metrics/${channelResourceId}/streamSessions?nextToken=${nextToken}`
  });

export const getStreamSessionData = async (
  channelResourceId,
  streamSessionId
) =>
  await authFetch({
    url: `${apiBaseUrl}/metrics/${channelResourceId}/streamSessions/${streamSessionId}`
  });
