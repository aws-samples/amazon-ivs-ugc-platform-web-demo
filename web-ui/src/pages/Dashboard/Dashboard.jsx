import { useEffect, useMemo } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

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
import useScrollTopOnPathnameChange from '../../hooks/useScrollTopOnPathnameChange';
import useThemeColor from '../../hooks/useThemeColor';
import withSessionLoader from '../../components/withSessionLoader';
import './Dashboard.css';

const Dashboard = () => {
  const {
    activeStreamSession,
    activeStreamSessionError,
    isInitialLoadingActiveStreamSession
  } = useStreams();
  const { isMobileView } = useMobileBreakpoint();
  const { isSessionValid, userData, fetchUserData } = useUser();
  const { modal } = useModal();
  const outletContext = useMemo(
    () => ({
      activeStreamSession,
      activeStreamSessionError,
      isInitialLoadingActiveStreamSession
    }),
    [
      activeStreamSession,
      activeStreamSessionError,
      isInitialLoadingActiveStreamSession
    ]
  );

  useScrollTopOnPathnameChange();
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
      <main className="main-dashboard-container">
        <Modal isOpen={!!modal} />
        <Notification />
        <Outlet context={outletContext} />
      </main>
      {isMobileView ? <FloatingMenu /> : <FloatingPlayer />}
    </>
  );
};

export default withSessionLoader(Dashboard);
