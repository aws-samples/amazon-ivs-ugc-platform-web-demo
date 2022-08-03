import PropTypes from 'prop-types';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  generatePath,
  useMatch,
  useNavigate,
  useParams
} from 'react-router-dom';

import { useUser } from '../../contexts/User';
import useActiveStreamSession from './useActiveStreamSession';
import useContextHook from '../useContextHook';
import useDebouncedCallback from '../../hooks/useDebouncedCallback';
import usePrevious from '../../hooks/usePrevious';
import useStreamSessions from './useStreamSessions';
import useThrottledCallback from '../../hooks/useThrottledCallback';

const Context = createContext(null);
Context.displayName = 'Streams';

export const Provider = ({ children }) => {
  const { isSessionValid, userData } = useUser();
  const { streamId: paramsStreamId } = useParams();
  const isInitialized = useRef(false);
  const isDashboardPage = !!useMatch('dashboard/*');
  const navigate = useNavigate();

  /**
   * STREAM SESSIONS LIST DATA
   */
  const {
    canLoadMoreStreamSessions,
    fetchStreamSessionsError,
    hasStreamSessions,
    isLoadingNextStreamSessionsPage,
    isValidatingStreamSessions,
    refreshCurrentStreamSessions,
    setIsLoadingNextStreamSessionsPage,
    setSize,
    setStreamSessions,
    streamSessions
  } = useStreamSessions({ isSessionValid, userData });

  const isLive = useMemo(
    () => streamSessions?.some(({ isLive }) => isLive) || false,
    [streamSessions]
  );

  /**
   * ACTIVE STREAM SESSION DATA
   */
  const {
    activeStreamSession,
    fetchActiveStreamSessionError,
    isValidatingActiveStreamSession,
    refreshCurrentActiveStreamSession,
    setActiveStreamSessionId,
    updateActiveStreamSession
  } = useActiveStreamSession({
    isLive,
    isSessionValid,
    setStreamSessions,
    streamSessions,
    userData
  });
  const prevActiveStreamSession = usePrevious(activeStreamSession);
  const hasActiveStreamChanged =
    prevActiveStreamSession?.streamId !== activeStreamSession?.streamId;

  const throttledUpdateStreamSessions = useThrottledCallback(
    (shouldFetchNextPage = false) => {
      if (shouldFetchNextPage && canLoadMoreStreamSessions) {
        setIsLoadingNextStreamSessionsPage(true);
        setSize((size) => size + 1);
      } else {
        refreshCurrentStreamSessions();
      }
    },
    1000,
    [refreshCurrentStreamSessions]
  );

  const debouncedUpdateActiveStreamSession = useDebouncedCallback(
    updateActiveStreamSession,
    500,
    [updateActiveStreamSession]
  );

  const eagerUpdateActiveStreamSession = useCallback(
    (session) => {
      setActiveStreamSessionId(session.streamId);
      navigate(
        generatePath('/dashboard/stream/:streamId', {
          streamId: session.streamId
        })
      );
      debouncedUpdateActiveStreamSession(session);
    },
    [debouncedUpdateActiveStreamSession, navigate, setActiveStreamSessionId]
  );

  const throttledRefreshCurrentActiveStreamSession = useThrottledCallback(
    () => refreshCurrentActiveStreamSession(),
    1000,
    [refreshCurrentActiveStreamSession]
  );

  // isLoadingStreamData logic
  const [isForceLoadingStreamData, setIsForceLoadingStreamData] =
    useState(false);
  const forceSpinnerTimeoutId = useRef();

  const forceSpinner = useCallback(() => {
    setIsForceLoadingStreamData(true);

    if (forceSpinnerTimeoutId.current) {
      clearTimeout(forceSpinnerTimeoutId.current);
    }

    forceSpinnerTimeoutId.current = setTimeout(
      () => setIsForceLoadingStreamData(false),
      500
    );
  }, []);

  const refreshCurrentStreamSessionsWithLoading = useCallback(() => {
    forceSpinner();
    throttledUpdateStreamSessions();
  }, [forceSpinner, throttledUpdateStreamSessions]);

  const refreshCurrentActiveStreamSessionWithLoading = useCallback(() => {
    forceSpinner();
    throttledRefreshCurrentActiveStreamSession();
  }, [forceSpinner, throttledRefreshCurrentActiveStreamSession]);

  const isInitialFetchingStreamData =
    (streamSessions === undefined && !fetchStreamSessionsError) ||
    (activeStreamSession &&
      !activeStreamSession.isMetadataFetched &&
      !fetchActiveStreamSessionError) ||
    (streamSessions?.length > 0 &&
      !activeStreamSession &&
      !fetchActiveStreamSessionError);

  const isLoadingStreamData =
    isInitialFetchingStreamData ||
    (isValidatingActiveStreamSession && fetchActiveStreamSessionError) ||
    (isValidatingStreamSessions && fetchStreamSessionsError) ||
    isForceLoadingStreamData ||
    hasActiveStreamChanged;

  // Initial fetch of the stream sessions list
  useEffect(() => {
    if (!isInitialized.current && userData && isSessionValid) {
      refreshCurrentStreamSessions();
    }
  }, [isSessionValid, refreshCurrentStreamSessions, userData]);

  // Initial fetch of the first stream metadata
  useEffect(() => {
    if (!isInitialized.current && hasStreamSessions) {
      const initialActiveStreamSession =
        streamSessions.find(({ streamId }) => streamId === paramsStreamId) ||
        streamSessions[0];
      setActiveStreamSessionId(initialActiveStreamSession.streamId);
      updateActiveStreamSession(initialActiveStreamSession);

      navigate(
        generatePath('/dashboard/stream/:streamId', {
          streamId: initialActiveStreamSession.streamId
        })
      );
      isInitialized.current = true;
    }

    if (!isInitialized.current && hasStreamSessions === false) {
      navigate('/dashboard/stream');
    }
  }, [
    hasStreamSessions,
    navigate,
    paramsStreamId,
    setActiveStreamSessionId,
    streamSessions,
    updateActiveStreamSession
  ]);

  // Update the active stream session based on a pathname change (i.e. hitting the back/forward button)
  useEffect(() => {
    if (
      isDashboardPage &&
      paramsStreamId &&
      activeStreamSession?.streamId &&
      paramsStreamId !== activeStreamSession.streamId
    ) {
      const paramsStream = streamSessions.find(
        ({ streamId }) => streamId === paramsStreamId
      );

      if (paramsStream) updateActiveStreamSession(paramsStream);
    }
  }, [
    activeStreamSession?.streamId,
    isDashboardPage,
    paramsStreamId,
    streamSessions,
    updateActiveStreamSession
  ]);

  // Update the pathname based on an active stream session change
  useEffect(() => {
    if (isDashboardPage && !paramsStreamId && activeStreamSession?.streamId) {
      navigate(
        generatePath('/dashboard/stream/:streamId', {
          streamId: activeStreamSession.streamId
        }),
        { replace: true }
      );
    }
  }, [
    activeStreamSession?.streamId,
    isDashboardPage,
    navigate,
    paramsStreamId
  ]);

  // Force a brief spinner when switching between active stream sessions
  useEffect(() => {
    if (hasActiveStreamChanged) {
      forceSpinner();
    }
  }, [forceSpinner, hasActiveStreamChanged]);

  const value = useMemo(
    () => ({
      activeStreamSession,
      canLoadMoreStreamSessions,
      fetchActiveStreamSessionError,
      fetchStreamSessionsError,
      hasStreamSessions,
      hasActiveStreamChanged,
      isInitialFetchingStreamData,
      isLive,
      isLoadingNextStreamSessionsPage,
      isLoadingStreamData,
      streamSessions,
      refreshCurrentActiveStreamSession:
        refreshCurrentActiveStreamSessionWithLoading,
      refreshCurrentStreamSessions,
      refreshCurrentStreamSessionsWithLoading,
      throttledUpdateStreamSessions,
      updateActiveStreamSession: eagerUpdateActiveStreamSession
    }),
    [
      activeStreamSession,
      canLoadMoreStreamSessions,
      eagerUpdateActiveStreamSession,
      fetchActiveStreamSessionError,
      fetchStreamSessionsError,
      hasActiveStreamChanged,
      hasStreamSessions,
      isInitialFetchingStreamData,
      isLive,
      isLoadingNextStreamSessionsPage,
      isLoadingStreamData,
      refreshCurrentActiveStreamSessionWithLoading,
      refreshCurrentStreamSessions,
      refreshCurrentStreamSessionsWithLoading,
      streamSessions,
      throttledUpdateStreamSessions
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useStreams = () => useContextHook(Context);
