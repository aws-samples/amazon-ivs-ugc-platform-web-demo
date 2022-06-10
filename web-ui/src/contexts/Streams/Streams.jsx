import PropTypes from 'prop-types';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

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
  const isInitialized = useRef(false);

  /**
   * STREAM SESSIONS LIST DATA
   */
  const {
    canLoadMoreStreamSessions,
    fetchStreamSessionsError,
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
      debouncedUpdateActiveStreamSession(session);
    },
    [debouncedUpdateActiveStreamSession, setActiveStreamSessionId]
  );

  const throttledRefreshCurrentActiveStreamSession = useThrottledCallback(
    () => refreshCurrentActiveStreamSession(),
    1000,
    [refreshCurrentActiveStreamSession]
  );

  // isLoadingStreamData logic
  const [isForceLoadingStreamData, setIsForceLoadingStreamData] =
    useState(false);
  const prevActiveStreamSession = usePrevious(activeStreamSession);

  const forceSpinner = useCallback(() => {
    setIsForceLoadingStreamData(true);

    return setTimeout(() => setIsForceLoadingStreamData(false), 500);
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
    prevActiveStreamSession?.streamId !== activeStreamSession?.streamId;

  // Initial fetch of the stream sessions list
  useEffect(() => {
    if (!isInitialized.current && userData && isSessionValid) {
      refreshCurrentStreamSessions();
    }
  }, [isSessionValid, refreshCurrentStreamSessions, userData]);

  // Initial fetch of the first stream metadata
  useEffect(() => {
    if (!isInitialized.current && streamSessions?.length) {
      setActiveStreamSessionId(streamSessions[0].streamId);
      updateActiveStreamSession(streamSessions[0]);
      isInitialized.current = true;
    }
  }, [setActiveStreamSessionId, streamSessions, updateActiveStreamSession]);

  // Force a brief spinner when switching between active stream sessions
  useEffect(() => {
    if (prevActiveStreamSession?.streamId !== activeStreamSession?.streamId) {
      forceSpinner();
    }
  }, [
    activeStreamSession?.streamId,
    forceSpinner,
    prevActiveStreamSession?.streamId
  ]);

  const value = useMemo(
    () => ({
      activeStreamSession,
      fetchActiveStreamSessionError,
      canLoadMoreStreamSessions,
      isInitialFetchingStreamData,
      isLoadingNextStreamSessionsPage,
      isLoadingStreamData,
      isLive,
      fetchStreamSessionsError,
      streamSessions,
      refreshCurrentActiveStreamSession:
        refreshCurrentActiveStreamSessionWithLoading,
      refreshCurrentStreamSessions,
      refreshCurrentStreamSessionsWithLoading,
      updateActiveStreamSession: eagerUpdateActiveStreamSession
    }),
    [
      activeStreamSession,
      canLoadMoreStreamSessions,
      eagerUpdateActiveStreamSession,
      fetchActiveStreamSessionError,
      fetchStreamSessionsError,
      isInitialFetchingStreamData,
      isLive,
      isLoadingNextStreamSessionsPage,
      isLoadingStreamData,
      refreshCurrentActiveStreamSessionWithLoading,
      refreshCurrentStreamSessions,
      refreshCurrentStreamSessionsWithLoading,
      streamSessions
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useStreams = () => useContextHook(Context);
