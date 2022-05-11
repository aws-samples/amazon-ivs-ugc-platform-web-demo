import { m } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCallback, useState } from 'react';
import PropTypes from 'prop-types';

import './FloatingPlayer.css';
import { app as $content } from '../../../content';
import { Sensors } from '../../../assets/icons';
import Button from '../../../components/Button';
import Spinner from '../../../components/Spinner';
import usePlayer from '../../../hooks/usePlayer';

const defaultAnimationProps = {
  animate: 'expanded',
  initial: 'collapsed',
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

const FloatingPlayer = ({
  activeStreamSession,
  isLive,
  playbackUrl,
  setIsLive,
  streamSessions,
  updateActiveSession
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isLoading, videoRef } = usePlayer({ setIsLive, playbackUrl });

  const { pathname } = useLocation();
  const navigate = useNavigate();

  const setLiveActiveStreamSession = useCallback(() => {
    updateActiveSession(streamSessions[0]);
    navigate('/');
  }, [navigate, streamSessions, updateActiveSession]);

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
        className="mini-player-container"
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
      </m.div>
    </div>
  );
};

FloatingPlayer.propTypes = {
  activeStreamSession: PropTypes.object,
  isLive: PropTypes.bool,
  playbackUrl: PropTypes.string,
  setIsLive: PropTypes.func.isRequired,
  streamSessions: PropTypes.array,
  updateActiveSession: PropTypes.func.isRequired
};

FloatingPlayer.defaultProps = {
  activeStreamSession: null,
  isLive: false,
  playbackUrl: '',
  streamSessions: []
};

export default FloatingPlayer;
