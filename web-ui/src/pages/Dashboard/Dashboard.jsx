import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';

import { dashboard as $content } from '../../content';
import { useMobileBreakpoint } from '../../contexts/MobileBreakpoint';
import { useModal } from '../../contexts/Modal';
import { useNotif } from '../../contexts/Notification';
import { userManagement } from '../../api';
import { useUser } from '../../contexts/User';
import FloatingMenu from './FloatingMenu';
import Header from './Header';
import Modal from '../../components/Modal';
import Notification from '../../components/Notification';
import useFirstMountState from '../../hooks/useFirstMountState';
import withSessionLoader from '../../components/withSessionLoader';
import './Dashboard.css';

const Dashboard = ({ children }) => {
  const [activeStreamSession, setActiveStreamSession] = useState(null);
  const [activeStreamSessionIdx, setActiveStreamSessionIdx] = useState(0);
  const [isCreatingResources, setIsCreatingResources] = useState(false);
  const [streamSessions, setStreamSessions] = useState([]);
  const { isMobileView } = useMobileBreakpoint();
  const { isSessionValid, fetchUserData, userData } = useUser();
  const { modal } = useModal();
  const { notifyError } = useNotif();
  const isFirstMount = useFirstMountState();
  const location = useLocation();

  // Initialize user resources
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

  // Fetch all stream sessions for this user's channel
  useEffect(() => {
    const fetchStreamSessions = async () => {
      const { channelResourceId } = userData;
      const { result, error } = await userManagement.getStreamSessions(
        channelResourceId
      );

      if (result) setStreamSessions(result.streamSessions);
      if (error) notifyError('Failed to load stream session list'); // TEMPORARY MESSAGE
    };

    if (userData) fetchStreamSessions();
  }, [notifyError, userData]);

  // Fetch data for the active stream session
  useEffect(() => {
    const fetchStreamSessionData = async () => {
      const { channelResourceId } = userData;
      const streamSessionId = streamSessions[activeStreamSessionIdx].streamId;
      const { result: session, error } =
        await userManagement.getStreamSessionData(
          channelResourceId,
          streamSessionId
        );

      if (session) {
        // Attach a live indicator to the stream session for convenience
        const isLive = !session.endTime;
        setActiveStreamSession({ ...session, isLive });
      }
      if (error) notifyError('Failed to load stream session'); // TEMPORARY MESSAGE
    };

    if (userData && streamSessions.length) fetchStreamSessionData();
  }, [activeStreamSessionIdx, notifyError, streamSessions, userData]);

  // Set theme-colour
  useEffect(() => {
    document
      .querySelector('meta[name="theme-color"]')
      .setAttribute('content', '#292b32');
  }, []);

  useEffect(() => window.scrollTo(0, 0), [location.pathname]);

  if (isSessionValid === false) return <Navigate to="/login" replace />;

  return (
    <>
      <Modal isOpen={!!modal} />
      <Header streamSessions={streamSessions} />
      <main className="main-dashboard-container">
        <Notification />
        {children ? children : <Outlet context={activeStreamSession} />}
      </main>
      {isMobileView && <FloatingMenu />}
    </>
  );
};

Dashboard.defaultProps = { children: null };

Dashboard.propTypes = { children: PropTypes.node };

export default withSessionLoader(Dashboard);
