import { reindexSessions } from '../../mocks/utils';
import { USE_MOCKS } from '../../constants';
import { metricsAPI } from '../../api';
import STREAM_SESSION_MOCK_DATA from '../../mocks';

export const streamSessionsFetcher = async (channelResourceId, nextToken) => {
  // Fetch up to 50 streams for this channel, ordered by start time
  const { result: data, error } = await metricsAPI.getStreamSessions(
    channelResourceId,
    nextToken
  );

  if (error) throw error;

  // Supplement the data to each stream session object
  let nextSessions =
    data.streamSessions?.map((session) => ({
      ...session,
      isLive: !session.endTime
    })) || [];

  // Mix in the mock data
  nextSessions = USE_MOCKS
    ? [
        ...nextSessions,
        ...reindexSessions(STREAM_SESSION_MOCK_DATA, nextSessions.length)
      ]
    : nextSessions;

  return {
    streamSessions: nextSessions,
    nextToken: data.nextToken,
    maxResults: data.maxResults
  };
};

export const streamSessionDataFetcher = async (
  channelResourceId,
  streamSession
) => {
  if (!channelResourceId || !streamSession) return;

  const { isLive, isMetadataFetched, streamId, isStale } = streamSession;

  // Check if we have already fetched metadata for this stream
  if (!isLive && isMetadataFetched && !isStale) return streamSession;

  // Fetch the stream metadata for the next active (selected) session
  const { result: streamSessionMetadata, error } =
    await metricsAPI.getStreamSessionData(channelResourceId, streamId);

  if (streamSessionMetadata) {
    const streamEvents = streamSessionMetadata.truncatedEvents.map(
      (streamEvent) => {
        const { eventTime, name } = streamEvent;
        const id = name + ' - ' + eventTime;

        return { ...streamEvent, id };
      }
    );

    return {
      ...streamSessionMetadata,
      truncatedEvents: streamEvents,
      isStale: false
    };
  }

  if (error) throw error;
};
