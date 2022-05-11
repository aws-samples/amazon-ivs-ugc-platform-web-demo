import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import './Dashboard.css';
import { reindexSessions } from '../../mocks/utils';
import { SESSIONS, SESSION_CONFIG_AND_EVENTS } from '../../mocks';
import { USE_MOCKS } from '../../constants';
import { useMobileBreakpoint } from '../../contexts/MobileBreakpoint';
import { useModal } from '../../contexts/Modal';
import { useNotif } from '../../contexts/Notification';
import { userManagement } from '../../api';
import { useUser } from '../../contexts/User';
import FloatingMenu from './FloatingMenu';
import FloatingPlayer from './FloatingPlayer';
import Header from './Header';
import Modal from '../../components/Modal';
import Notification from '../../components/Notification';
import withSessionLoader from '../../components/withSessionLoader';

const Dashboard = () => {
  const [isStreamLive, setIsStreamLive] = useState();
  const [activeStreamSession, setActiveStreamSession] = useState(null);
  const [streamSessions, setStreamSessions] = useState([]);
  const { fetchUserData, isSessionValid, userData } = useUser();
  const { isMobileView } = useMobileBreakpoint();
  const { modal } = useModal();
  const { notifyError } = useNotif();
  const location = useLocation();

  const updateSessionsList = useCallback(async () => {
    if (!userData) return;

    const { result, error } = await userManagement.getStreamSessions(
      userData.channelResourceId
    );

    if (result) {
      let sessions = result.streamSessions.map((session, index) => ({
        ...session,
        index,
        isLive: !session.endTime
      }));

      sessions = USE_MOCKS
        ? [...sessions, ...reindexSessions(SESSIONS, sessions.length)]
        : sessions;

      setStreamSessions((prevSessions) =>
        JSON.stringify(prevSessions) === JSON.stringify(sessions)
          ? prevSessions
          : sessions
      );
    }
    if (error) notifyError('Failed to load stream session list'); // TEMPORARY MESSAGE
  }, [notifyError, userData]);

  const updateActiveSession = useCallback(
    async (nextStreamSession) => {
      if (
        !userData ||
        !streamSessions.length ||
        !nextStreamSession?.streamId ||
        nextStreamSession.streamId === activeStreamSession?.streamId
      )
        return;

      // Fetch the session data for the currently active (selected) stream session
      const { result, error } = await userManagement.getStreamSessionData(
        userData.channelResourceId,
        nextStreamSession.streamId
      );
      const sessionData = USE_MOCKS ? SESSION_CONFIG_AND_EVENTS : result;

      // Supplement the retrieved session data and save the result in state
      if (sessionData) {
        const isLive = !sessionData.endTime;
        sessionData.streamId = nextStreamSession.streamId;
        setActiveStreamSession({
          ...nextStreamSession,
          ...sessionData,
          isLive // Attach a live indicator to the stream session for convenience
        });

        return;
      }
      if (error) notifyError('Failed to load stream session'); // TEMPORARY MESSAGE
    },
    [activeStreamSession?.streamId, notifyError, streamSessions, userData]
  );

  useEffect(() => {
    updateSessionsList();
  }, [updateSessionsList, isStreamLive]);

  const isInitialized = useRef(false);
  useEffect(() => {
    if (!isInitialized.current && streamSessions.length) {
      const initialSession = streamSessions[0];
      updateActiveSession(initialSession);
      isInitialized.current = true;
    }
  }, [streamSessions, updateActiveSession]);

  // Set theme-colour
  useEffect(() => {
    document
      .querySelector('meta[name="theme-color"]')
      .setAttribute('content', '#292b32');
  }, []);

  useEffect(() => window.scrollTo(0, 0), [location.pathname]);

  useEffect(() => {
    if (!userData && isSessionValid) {
      fetchUserData();
    }
  }, [fetchUserData, isSessionValid, userData]);

  if (isSessionValid === false) return <Navigate to="/login" replace />;

  return (
    <>
      <Header
        activeStreamSession={activeStreamSession}
        streamSessions={streamSessions}
        updateActiveSession={updateActiveSession}
        updateSessionsList={updateSessionsList}
      />
      <main className="main-dashboard-container">
        <Modal isOpen={!!modal} />
        <Notification />
        <Outlet context={activeStreamSession} />
      </main>
      {isMobileView ? (
        <FloatingMenu />
      ) : (
        <FloatingPlayer
          activeStreamSession={activeStreamSession}
          isLive={isStreamLive}
          playbackUrl={userData?.playbackUrl}
          setIsLive={setIsStreamLive}
          streamSessions={streamSessions}
          updateActiveSession={updateActiveSession}
        />
      )}
    </>
  );
};

export default withSessionLoader(Dashboard);
