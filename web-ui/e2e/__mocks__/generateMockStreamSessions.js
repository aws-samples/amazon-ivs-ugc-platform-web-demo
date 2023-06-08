const mockOfflineStreamSession = require('./offlineStreamSession.json');

const {
  startTime: mockStartTime,
  endTime: mockEndTime,
  ingestConfiguration: mockIngestConfiguration,
  channel: mockChannel,
  metrics: mockMetrics,
  truncatedEvents: mockTruncatedEvents
} = mockOfflineStreamSession;

const offlineStreamSession = {
  hasErrorEvent: false,
  streamId: 'mockStreamId',
  endTime: mockEndTime,
  startTime: mockStartTime,
  isLive: false
};
const mockSessionDurationInMs =
  new Date(mockEndTime).getTime() - new Date(mockStartTime).getTime();
const highQualityMetricsPeriodInSec = 3 * 60 * 60 * 1000; // Three hours in ms
const maxSessionsCount = Math.floor(
  highQualityMetricsPeriodInSec / mockSessionDurationInMs
);

/**
 * This function is used to generate a list of stream sessions.
 *
 * For simplicity, the mock session generated include high quality metrics.
 * For this reason, `generateMockStreamSessions` will limit the list to `maxSessionsCount`, which is based on the duration of the mock session.
 *
 * This function can be used to simulate a user going from offline to live or the reverse:
 * ```js
 * let streamSessions = generateMockStreamSessions(3) // offline
 * streamSessions = generateMockStreamSessions(4, true) // online
 * ```
 *
 * @param {number} streamSessionsCount
 * @param {boolean} shouldIncludeLiveSession
 */
const generateMockStreamSessions = (
  streamSessionsCount = 0,
  shouldIncludeLiveSession = false
) => {
  const streamSessions = [];

  if (!streamSessionsCount) return streamSessions;

  let boundedStreamSessionCount =
    streamSessionsCount > maxSessionsCount
      ? maxSessionsCount
      : streamSessionsCount;
  if (shouldIncludeLiveSession) boundedStreamSessionCount -= 1;

  for (let index = 0; index < boundedStreamSessionCount; index++) {
    const startTime = new Date(
      Date.now() -
        (boundedStreamSessionCount - index + 1) * mockSessionDurationInMs
    ).toISOString();
    const endTime = new Date(
      Date.now() - (boundedStreamSessionCount - index) * mockSessionDurationInMs
    ).toISOString();

    streamSessions.push({
      ...offlineStreamSession,
      streamId: `streamId-${index}`,
      endTime,
      startTime
    });
  }

  if (shouldIncludeLiveSession) {
    streamSessions.push({
      ...offlineStreamSession,
      streamId: `streamId-${boundedStreamSessionCount}`,
      endTime: undefined,
      startTime: new Date(Date.now() - mockSessionDurationInMs).toISOString(),
      isLive: true
    });
  }

  return streamSessions.reverse();
};

const generateMockStreamSession = (options = offlineStreamSession) => {
  const { endTime, startTime, isLive } = options;

  let truncatedEvents = mockTruncatedEvents.map((mockTruncatedEvent) => ({
    ...mockTruncatedEvent,
    eventTime: ['Session Ended', 'Stream End'].includes(mockTruncatedEvent.name)
      ? endTime
      : startTime
  }));

  if (isLive) {
    truncatedEvents = truncatedEvents.slice(0, 2).reverse();
  }

  return {
    ...options,
    ingestConfiguration: mockIngestConfiguration,
    channel: mockChannel,
    isHealthy: true,
    metrics: mockMetrics.map((mockMetric) => ({
      ...mockMetric,
      alignedStartTime: startTime
    })),
    truncatedEvents
  };
};

module.exports = { generateMockStreamSession, generateMockStreamSessions };
