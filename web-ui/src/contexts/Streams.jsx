import PropTypes from 'prop-types';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import { dashboard as $content } from '../content';
import { reindexSessions } from '../mocks/utils';
import { SESSIONS, SESSION_CONFIG_AND_EVENTS } from '../mocks';
import { USE_MOCKS } from '../constants';
import { useNotif } from '../contexts/Notification';
import { userManagement } from '../api';
import { useUser } from '../contexts/User';
import useContextHook from './useContextHook';
import useStateWithCallback from '../hooks/useStateWithCallback';

const Context = createContext(null);
Context.displayName = 'Streams';

export const Provider = ({ children }) => {
  const [activeStreamSessionId, setActiveStreamSessionId] = useState();
  const [streamSessions, setStreamSessions] = useStateWithCallback([]);
  const { isSessionValid, userData } = useUser();
  const { notifyError } = useNotif();
  const [isPlayerLive, setIsPlayerLive] = useState(false);
  const isStreamSessionLive = useMemo(
    () => !!streamSessions?.[0]?.isLive,
    [streamSessions]
  );
  const isInitialized = useRef(false);
  const activeStreamSession = useMemo(
    () =>
      streamSessions.find(({ streamId }) => streamId === activeStreamSessionId),
    [activeStreamSessionId, streamSessions]
  );

  const isLive = isStreamSessionLive || isPlayerLive;

  const updateSessionsList = useCallback(async () => {
    const { result, error } = await userManagement.getStreamSessions(
      userData.channelResourceId
    );

    if (result) {
      let nextSessions = result.streamSessions.map((session, index, arr) => ({
        ...session,
        index,
        isLive: !session.endTime
      }));

      nextSessions = USE_MOCKS
        ? [...nextSessions, ...reindexSessions(SESSIONS, nextSessions.length)]
        : nextSessions;

      setStreamSessions((prevSessions) => {
        // Merge previous stream data with the new stream data we just fetched
        const indexOffset = nextSessions.length - prevSessions.length;
        for (let i = nextSessions.length - 1; i >= 0; i--) {
          nextSessions[i] = {
            ...prevSessions[i - indexOffset],
            ...nextSessions[i]
          };
        }
        const shouldUpdateStreams =
          nextSessions.length !== prevSessions.length ||
          JSON.stringify(nextSessions) !== JSON.stringify(prevSessions);

        return shouldUpdateStreams ? nextSessions : prevSessions;
      });
    }
    if (error) notifyError($content.notification.error.streams_fetch_failed);
  }, [notifyError, setStreamSessions, userData]);

  const updateActiveSession = useCallback(
    async (streamSession) => {
      if (!streamSession || !userData) return;

      const { streamId, isMetadataFetched } = streamSession;

      // Check if we have already fetched metadata for this stream
      if (isMetadataFetched) return setActiveStreamSessionId(streamId);

      // Fetch the stream metadata for the next active (selected) session
      const { result, error } = await userManagement.getStreamSessionData(
        userData.channelResourceId,
        streamId
      );

      const streamSessionMetadata =
        !result && USE_MOCKS ? SESSION_CONFIG_AND_EVENTS : result;

      if (streamSessionMetadata) {
        return setStreamSessions(
          (prevStreamSessions) =>
            prevStreamSessions.map((streamSession) => {
              return streamSession.streamId === streamId
                ? {
                    ...streamSession,
                    ...streamSessionMetadata,
                    isLive: !streamSession.endTime, // Attach a live indicator to the stream session for convenience
                    isMetadataFetched: true,
                    streamId
                  }
                : streamSession;
            }),
          () => setActiveStreamSessionId(streamId)
        );
      }
      if (error) notifyError($content.notification.error.session_fetch_failed);
    },
    [notifyError, setStreamSessions, userData]
  );

  // Inital fetch of the streams lists
  useEffect(() => {
    if (userData && isSessionValid) {
      updateSessionsList();
    }
  }, [isSessionValid, updateSessionsList, userData]);

  // Initial fetch of the first stream metadata
  useEffect(() => {
    if (!isInitialized.current && streamSessions.length) {
      updateActiveSession(streamSessions[0]);
      isInitialized.current = true;
    }
  }, [streamSessions, updateActiveSession]);

  const value = useMemo(
    () => ({
      activeStreamSession,
      isLive,
      setIsPlayerLive,
      setStreamSessions,
      streamSessions,
      updateActiveSession,
      updateSessionsList
    }),
    [
      activeStreamSession,
      isLive,
      setStreamSessions,
      streamSessions,
      updateActiveSession,
      updateSessionsList
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useStreams = () => useContextHook(Context);
