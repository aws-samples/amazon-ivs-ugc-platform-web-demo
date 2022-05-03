import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';

import { dashboard as $content } from '../../content';
import { useModal } from '../../contexts/Modal';
import { useNotif } from '../../contexts/Notification';
import { userManagement } from '../../api';
import { useUser } from '../../contexts/User';
import { useMobileBreakpoint } from '../../contexts/MobileBreakpoint';
import FloatingMenu from './FloatingMenu';
import Header from './Header';
import Modal from '../../components/Modal';
import Notification from '../../components/Notification';
import useFirstMountState from '../../hooks/useFirstMountState';
import withSessionLoader from '../../components/withSessionLoader';
import './Dashboard.css';

const Dashboard = ({ children }) => {
  // eslint-disable-next-line no-unused-vars
  const [isCreatingResources, setIsCreatingResources] = useState(false);
  const { isMobileView } = useMobileBreakpoint();
  const { isSessionValid, fetchUserData, userData } = useUser();
  const { notifyError } = useNotif();
  const { modal } = useModal();
  const location = useLocation();
  const isFirstMount = useFirstMountState();

  // Set theme-colour
  useEffect(() => {
    document
      .querySelector('meta[name="theme-color"]')
      .setAttribute('content', '#292b32');
  }, []);

  useEffect(() => window.scrollTo(0, 0), [location.pathname]);

  useEffect(() => {
    const initUser = async () => {
      setIsCreatingResources(true);
      const { result, error } = await userManagement.createResources();

      if (result) fetchUserData(result);
      if (error) notifyError($content.stream_session_page.account_setup_error);

      setIsCreatingResources(false);
    };

    if (isFirstMount && isSessionValid === true && !userData) {
      initUser();
    }
  }, [isFirstMount, isSessionValid, notifyError, fetchUserData, userData]);

  if (isSessionValid === false) return <Navigate to="/login" replace />;

  return (
    <>
      <Modal isOpen={!!modal} />
      <Header />
      <main id="main-dashboard-container" className="main-dashboard-container">
        <Notification />
        {children ? children : <Outlet />}
      </main>
      {isMobileView && <FloatingMenu />}
    </>
  );
};

Dashboard.defaultProps = { children: null };

Dashboard.propTypes = { children: PropTypes.node };

export default withSessionLoader(Dashboard);
