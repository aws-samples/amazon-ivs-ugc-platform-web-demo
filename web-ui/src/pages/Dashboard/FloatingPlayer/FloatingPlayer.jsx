import { m } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCallback, useState } from 'react';

import './FloatingPlayer.css';
import { app as $content } from '../../../content';
import { Sensors } from '../../../assets/icons';
import { useStreams } from '../../../contexts/Streams';
import { useUser } from '../../../contexts/User';
import Button from '../../../components/Button';
import Spinner from '../../../components/Spinner';
import usePlayer from '../../../hooks/usePlayer';

const defaultAnimationProps = {
  initial: 'expanded',
  exit: 'collapsed',
  transition: {
    duration: 0.5,
    ease: 'easeInOut'
  },
  variants: {
    collapsed: { scale: 0, x: -21 },
    expanded: { scale: 1, x: 0 }
  }
};

const FloatingPlayer = () => {
  const { activeStreamSession, isLive, streamSessions, updateActiveSession } =
    useStreams();
  const { userData } = useUser();
  const { isLoading, videoRef } = usePlayer({
    isLive,
    playbackUrl: userData?.playbackUrl
  });
  const [isExpanded, setIsExpanded] = useState(true);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const hasStreamSessions = !!streamSessions?.length;
  const shouldShowFloatingPlayer = isLive || hasStreamSessions;

  const setLiveActiveStreamSession = useCallback(() => {
    updateActiveSession(streamSessions?.[0]);
    navigate('/');
  }, [navigate, streamSessions, updateActiveSession]);

  if (!shouldShowFloatingPlayer) return null;

  return (
    <div className="floating-player">
      <Button
        className="icon-button"
        onClick={() => setIsExpanded((prev) => !prev)}
        variant="secondary"
      >
        <Sensors isLive={isLive} />
      </Button>
      <m.div
        {...defaultAnimationProps}
        animate={isExpanded ? 'expanded' : 'collapsed'}
        className={`mini-player-container ${isLive ? 'is-live' : ''}`}
      >
        {isLive &&
          (activeStreamSession?.index > 0 || pathname === '/settings') && (
            <Button onClick={setLiveActiveStreamSession} variant="secondary">
              {$content.floating_player.view_stream_session}
            </Button>
          )}
        <div
          className="video-container"
          style={isLive ? {} : { display: 'none' }}
        >
          {isLoading && isLive !== false && <Spinner variant="light" />}
          <video ref={videoRef} playsInline muted></video>
          <div className="red-pill">{$content.floating_player.live}</div>
        </div>
        {!isLive && (
          <div className="offline-stream-container">
            {hasStreamSessions ? (
              <p className="mini-player-text ">
                {$content.floating_player.no_current_live_stream}
              </p>
            ) : (
              <>
                <h4>{$content.floating_player.no_current_live_stream}</h4>
                <p className="mini-player-text offline-instructions">
                  {$content.floating_player.offline_instructions}
                </p>
                <Link to="/settings">{$content.floating_player.settings}</Link>
              </>
            )}
          </div>
        )}
      </m.div>
    </div>
  );
};

export default FloatingPlayer;
