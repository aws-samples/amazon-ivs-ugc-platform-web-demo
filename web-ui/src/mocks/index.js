import SESSIONS from './sessions.json';
import SESSION_CONFIG_AND_EVENTS from './sessionConfigAndEvents.json';
import SESSION_ERROR_CONFIG from './sessionErrorConfig.json';

const STREAM_SESSION_MOCK_DATA = SESSIONS.reduce(
  (acc, sessionData) => [
    ...acc,
    {
      ...sessionData,
      ...SESSION_CONFIG_AND_EVENTS,
      ...(sessionData.streamId === 'mock-st-config-errors'
        ? SESSION_ERROR_CONFIG
        : {})
    }
  ],
  []
);

export { SESSIONS, SESSION_CONFIG_AND_EVENTS, SESSION_ERROR_CONFIG };

export default STREAM_SESSION_MOCK_DATA;
