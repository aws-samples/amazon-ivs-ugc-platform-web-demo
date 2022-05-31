import PropTypes from 'prop-types';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import useSWRInfinite from 'swr/infinite';

import { dashboard as $content } from '../content';
import { reindexSessions } from '../mocks/utils';
import STREAM_SESSION_MOCK_DATA from '../mocks';
import {
  STREAM_SESSION_DATA_REFRESH_INTERVAL,
  STREAM_SESSIONS_REFRESH_INTERVAL,
  USE_MOCKS
} from '../constants';
import { useNotif } from '../contexts/Notification';
import { userManagement } from '../api';
import { useUser } from '../contexts/User';
import useContextHook from './useContextHook';
import useDebouncedCallback from '../hooks/useDebouncedCallback';
import useStateWithCallback from '../hooks/useStateWithCallback';
import useSWRWithKeyUpdate from '../hooks/useSWRWithKeyUpdate';
import useThrottledCallback from '../hooks/useThrottledCallback';

const Context = createContext(null);
Context.displayName = 'Streams';

const streamSessionsFetcher = async (channelResourceId, nextToken) => {
  // Fetch up to 50 streams for this channel, ordered by start time
  const { result: data, error } = await userManagement.getStreamSessions(
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
    nextToken: data.nextToken
  };
};

const activeStreamSessionFetcher = async (channelResourceId, streamSession) => {
  if (!channelResourceId || !streamSession) return;

  const { isLive, isMetadataFetched, streamId } = streamSession;

  // Check if we have already fetched metadata for this stream
  if (!isLive && isMetadataFetched) return streamSession;

  // Fetch the stream metadata for the next active (selected) session
  const { result: streamSessionMetadata, error } =
    await userManagement.getStreamSessionData(channelResourceId, streamId);

  if (streamSessionMetadata) {
    const streamEvents = streamSessionMetadata.truncatedEvents.map(
      (streamEvent) => {
        const { eventTime, name } = streamEvent;
        const id = name + ' - ' + eventTime;

        return { ...streamEvent, id };
      }
    );

    return { ...streamSessionMetadata, truncatedEvents: streamEvents };
  }

  if (error) throw error;
};

export const Provider = ({ children }) => {
  const { isSessionValid, userData } = useUser();
  const { notifyError } = useNotif();
  const isInitialized = useRef(false);

  /**
   * STREAM SESSIONS
   */
  const [streamSessions, setStreamSessions] = useStateWithCallback();
  const [canLoadMoreStreamSessions, setCanLoadMoreStreamSessions] =
    useState(true);
  const [isLoadingNextStreamSessionsPage, setIsLoadingNextStreamSessionsPage] =
    useState(false);
  const isLive = useMemo(
    () => streamSessions?.some(({ isLive }) => isLive) || false,
    [streamSessions]
  );
  // By default, useSWRInfinite will revalidate the first page, which will trigger a downstream
  // revalidation of all the subsequent pages as well.
  const { setSize, mutate: updateStreamSessionsList } = useSWRInfinite(
    // This function is called before each fetcher request.
    // It is also triggered by a call to setSize().
    (_pageIndex, previousPageData) => {
      if (!isSessionValid || !userData) return null;

      if (previousPageData && !previousPageData.nextToken) return null; // reached the end of the stream sessions list

      if (previousPageData && previousPageData.nextToken)
        return [userData.channelResourceId, previousPageData.nextToken]; // fetch the next page of stream sessions

      return [userData.channelResourceId]; // fetch the first page
    },
    streamSessionsFetcher,
    {
      dedupingInterval: 1000,
      fallbackData: [],
      refreshInterval: STREAM_SESSIONS_REFRESH_INTERVAL,
      revalidateOnMount: true,
      onError: () => {
        notifyError($content.notification.error.streams_fetch_failed);
        if (isLoadingNextStreamSessionsPage)
          setIsLoadingNextStreamSessionsPage(false);
      },
      onSuccess: (sessions) => {
        const nextSessions = sessions
          .reduce((sessionsAcc, { streamSessions }) => {
            return [...sessionsAcc, ...streamSessions];
          }, [])
          .map((session, index) => ({ ...session, index }));

        const { nextToken: lastestToken } = sessions[sessions.length - 1];
        setCanLoadMoreStreamSessions(!!lastestToken);

        setStreamSessions((prevSessions) => {
          if (!prevSessions) return nextSessions;

          // Merge previous stream data with the new stream data we just fetched
          const mergedSessions = nextSessions.reduce((acc, nextSession) => {
            const { streamId: nextStreamId } = nextSession;
            const prevSession =
              prevSessions.find(
                ({ streamId: prevStreamId }) => prevStreamId === nextStreamId
              ) || {};

            const mergedSession = { ...prevSession, ...nextSession };

            return [...acc, mergedSession];
          }, []);

          const shouldUpdateStreams =
            nextSessions.length !== prevSessions.length ||
            JSON.stringify(nextSessions) !== JSON.stringify(prevSessions);

          return shouldUpdateStreams ? mergedSessions : prevSessions;
        });

        if (isLoadingNextStreamSessionsPage)
          setIsLoadingNextStreamSessionsPage(false);
      }
    }
  );

  /**
   * ACTIVE STREAM SESSION DATA
   */
  const [activeStreamSessionId, setActiveStreamSessionId] = useState();
  const activeStreamSession = useMemo(
    () =>
      streamSessions?.find(
        ({ streamId }) => streamId === activeStreamSessionId
      ),
    [activeStreamSessionId, streamSessions]
  );
  const {
    error: activeStreamSessionError,
    updateKey: updateActiveStreamSession
  } = useSWRWithKeyUpdate(
    userData && isSessionValid && userData.channelResourceId,
    activeStreamSessionFetcher,
    {
      refreshInterval: isLive ? STREAM_SESSION_DATA_REFRESH_INTERVAL : 0,
      revalidateOnMount: true,
      dedupingInterval: 0,
      onError: () => {
        notifyError($content.notification.error.session_fetch_failed);
      },
      onSuccess: (streamSessionMetadata) => {
        setStreamSessions(
          (prevStreamSessions) =>
            prevStreamSessions?.map((prevStreamSession) =>
              prevStreamSession.streamId === streamSessionMetadata.streamId
                ? {
                    ...prevStreamSession,
                    ...streamSessionMetadata,
                    isLive: !prevStreamSession.endTime, // Attach a live indicator to the stream session for convenience
                    isMetadataFetched: true,
                    streamId: streamSessionMetadata.streamId
                  }
                : prevStreamSession
            ),
          () => setActiveStreamSessionId(streamSessionMetadata.streamId)
        );
      }
    }
  );

  const throttledUpdateStreamSessionsList = useThrottledCallback(
    (shouldFetchNextPage = false) => {
      if (shouldFetchNextPage && canLoadMoreStreamSessions) {
        setIsLoadingNextStreamSessionsPage(true);
        setSize((size) => size + 1);
      } else {
        updateStreamSessionsList();
      }
    },
    1000,
    [updateStreamSessionsList]
  );

  const debouncedUpdateActiveStreamSession = useDebouncedCallback(
    updateActiveStreamSession,
    500,
    [updateActiveStreamSession]
  );

  const eagerUpdateActiveStreamSession = useCallback(
    (session) => {
      setActiveStreamSessionId(session.streamId);
      debouncedUpdateActiveStreamSession(session);
    },
    [debouncedUpdateActiveStreamSession]
  );

  // Initial fetch of the stream sessions list
  useEffect(() => {
    if (!isInitialized.current && userData && isSessionValid) {
      updateStreamSessionsList();
    }
  }, [isSessionValid, updateStreamSessionsList, userData]);

  // Initial fetch of the first stream metadata
  useEffect(() => {
    if (!isInitialized.current && streamSessions?.length) {
      updateActiveStreamSession(streamSessions[0]);
      isInitialized.current = true;
    }
  }, [streamSessions, updateActiveStreamSession]);

  const value = useMemo(
    () => ({
      activeStreamSession,
      activeStreamSessionError,
      canLoadMoreStreamSessions,
      isLoadingNextStreamSessionsPage,
      isLive,
      streamSessions,
      updateActiveStreamSession: eagerUpdateActiveStreamSession,
      updateStreamSessionsList: throttledUpdateStreamSessionsList,
      isInitialLoadingActiveStreamSession:
        streamSessions === undefined ||
        (activeStreamSession && !activeStreamSession.isMetadataFetched) ||
        (streamSessions.length > 0 &&
          !activeStreamSession &&
          !activeStreamSessionError)
    }),
    [
      activeStreamSession,
      activeStreamSessionError,
      canLoadMoreStreamSessions,
      eagerUpdateActiveStreamSession,
      isLoadingNextStreamSessionsPage,
      isLive,
      streamSessions,
      throttledUpdateStreamSessionsList
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useStreams = () => useContextHook(Context);
