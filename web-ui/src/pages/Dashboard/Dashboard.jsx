import { useEffect, useMemo } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

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
    hasActiveStreamChanged,
    hasStreamSessions,
    isInitialFetchingStreamData,
    isLoadingStreamData,
    refreshCurrentActiveStreamSession,
    refreshCurrentStreamSessionsWithLoading
  } = useStreams();
  const { isDefaultResponsiveView, mainRef } = useMobileBreakpoint();
  const { isSessionValid, userData, fetchUserData, prevIsSessionValid } =
    useUser();
  const { modal } = useModal();
  const location = useLocation();
  const outletContext = useMemo(
    () => ({
      activeStreamSession,
      fetchActiveStreamSessionError,
      fetchStreamSessionsError,
      hasActiveStreamChanged,
      hasStreamSessions,
      isInitialFetchingStreamData,
      isLoadingStreamData,
      refreshCurrentActiveStreamSession,
      refreshCurrentStreamSessionsWithLoading
    }),
    [
      activeStreamSession,
      fetchActiveStreamSessionError,
      fetchStreamSessionsError,
      hasActiveStreamChanged,
      hasStreamSessions,
      isInitialFetchingStreamData,
      isLoadingStreamData,
      refreshCurrentActiveStreamSession,
      refreshCurrentStreamSessionsWithLoading
    ]
  );

  useScrollToTop({
    dependency: activeStreamSession?.streamId,
    isResponsiveView: isDefaultResponsiveView
  });
  useThemeColor(DASHBOARD_THEME_COLOR);

  // Initial fetch of the user data
  useEffect(() => {
    if (!userData && isSessionValid) {
      fetchUserData();
    }
  }, [fetchUserData, isSessionValid, userData]);

  if (isSessionValid === false)
    /**
     * Redirect the user to the /login page, but save the current location
     * they were trying to go to when they were redirected. This allows us
     * to send them along to that page after they login.
     */
    return (
      <Navigate
        to={`/login${location?.search || ''}`}
        {...(!prevIsSessionValid ? { state: { from: location } } : {})}
        replace
      />
    );

  return (
    <>
      <Header />
      <main
        id={`main-dashboard-container${
          isDefaultResponsiveView ? '-scrollable' : ''
        }`}
        className="main-dashboard-container"
        ref={mainRef}
      >
        <Modal isOpen={!!modal} />
        <Notification top={79} />
        <Outlet context={outletContext} />
      </main>
      {isDefaultResponsiveView ? <FloatingMenu /> : <FloatingPlayer />}
    </>
  );
};

export default withSessionLoader(Dashboard);
