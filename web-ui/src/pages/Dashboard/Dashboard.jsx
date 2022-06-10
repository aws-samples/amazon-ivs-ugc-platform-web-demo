import { useEffect, useMemo } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import './Dashboard.css';
import { DASHBOARD_THEME_COLOR } from '../../constants';
import { useMobileBreakpoint } from '../../contexts/MobileBreakpoint';
import { useModal } from '../../contexts/Modal';
import { useStreams } from '../../contexts/Streams';
import { useUser } from '../../contexts/User';
import FloatingMenu from './FloatingMenu';
import FloatingPlayer from './FloatingPlayer';
import Header from './Header';
import Modal from '../../components/Modal';
import Notification from '../../components/Notification';
import useScrollToTop from '../../hooks/useScrollToTop';
import useThemeColor from '../../hooks/useThemeColor';
import withSessionLoader from '../../components/withSessionLoader';

const Dashboard = () => {
  const {
    activeStreamSession,
    fetchActiveStreamSessionError,
    fetchStreamSessionsError,
    isInitialFetchingStreamData,
    isLoadingStreamData,
    refreshCurrentActiveStreamSession,
    refreshCurrentStreamSessionsWithLoading,
    streamSessions
  } = useStreams();
  const { isMobileView } = useMobileBreakpoint();
  const { isSessionValid, userData, fetchUserData } = useUser();
  const { modal } = useModal();
  const outletContext = useMemo(
    () => ({
      activeStreamSession,
      fetchActiveStreamSessionError,
      fetchStreamSessionsError,
      isInitialFetchingStreamData,
      hasStreamSessions: !streamSessions
        ? undefined
        : streamSessions.length > 0,
      isLoadingStreamData,
      refreshCurrentActiveStreamSession,
      refreshCurrentStreamSessionsWithLoading
    }),
    [
      activeStreamSession,
      fetchActiveStreamSessionError,
      fetchStreamSessionsError,
      isInitialFetchingStreamData,
      isLoadingStreamData,
      refreshCurrentActiveStreamSession,
      refreshCurrentStreamSessionsWithLoading,
      streamSessions
    ]
  );

  const { mainRef } = useScrollToTop(activeStreamSession?.streamId);
  useThemeColor(DASHBOARD_THEME_COLOR);

  // Initial fetch of the user data
  useEffect(() => {
    if (!userData && isSessionValid) {
      fetchUserData();
    }
  }, [fetchUserData, isSessionValid, userData]);

  if (isSessionValid === false) return <Navigate to="/login" replace />;

  return (
    <>
      <Header />
      <main
        id={`main-dashboard-container${isMobileView ? '' : '-scrollable'}`}
        className="main-dashboard-container"
        ref={mainRef}
      >
        <Modal isOpen={!!modal} />
        <Notification top={79} />
        <Outlet context={outletContext} />
      </main>
      {isMobileView ? <FloatingMenu /> : <FloatingPlayer />}
    </>
  );
};

export default withSessionLoader(Dashboard);
