import { Link, useLocation, useNavigate } from 'react-router-dom';
import { m } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
  const {
    activeStreamSession,
    isLive,
    streamSessions,
    updateActiveStreamSession
  } = useStreams();
  const { userData } = useUser();
  const { isLoading, playerRef, videoRef } = usePlayer({
    isLive,
    playbackUrl: userData?.playbackUrl
  });
  const [isExpanded, setIsExpanded] = useState(true);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const hasStreamSessions = !!streamSessions?.length;
  const shouldShowFloatingPlayer = isLive || streamSessions;
  const canvasRef = useRef();
  const isBlurring = useRef(false);
  const shouldBlurPlayer = useMemo(() => {
    const liveSession = streamSessions?.find(
      (streamSession) => streamSession.isLive
    );

    if (liveSession) {
      const videoWidth = liveSession?.ingestConfiguration?.video?.videoWidth;
      const videoHeight = liveSession?.ingestConfiguration?.video?.videoHeight;

      if (videoWidth && videoHeight) {
        // If the video ratio isn't 16:9, blur the sides
        return !!(videoHeight / videoWidth !== 0.5625);
      }
    }

    return true;
  }, [streamSessions]);

  const setLiveActiveStreamSession = useCallback(() => {
    updateActiveStreamSession(streamSessions?.[0]);
    navigate('/');
  }, [navigate, streamSessions, updateActiveStreamSession]);

  const startBlur = useCallback(() => {
    if (canvasRef.current && !isBlurring.current) {
      clearCanvas();
      isBlurring.current = true;

      const context = canvasRef.current.getContext('2d');
      context.filter = 'blur(5px)';

      const draw = () => {
        if (canvasRef.current) {
          context.drawImage(
            videoRef.current,
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );

          requestAnimationFrame(draw);
        }
      };

      requestAnimationFrame(draw);
    }
  }, [videoRef]);

  const clearCanvas = () => {
    if (canvasRef.current) {
      const context = canvasRef.current.getContext('2d');

      context.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
    }
  };

  useEffect(() => {
    if (isLive && !isLoading && shouldBlurPlayer) {
      startBlur();

      return clearCanvas;
    }
  }, [isLive, isLoading, shouldBlurPlayer, startBlur]);

  // Lower the rendition of the player to the lowest available resolution
  useEffect(() => {
    if (playerRef.current && isLive && !isLoading) {
      const qualities = playerRef.current?.getQualities() || [];
      const lowestQuality = qualities.pop();

      if (lowestQuality) {
        playerRef.current.setQuality(lowestQuality, true);
      }
    }
  }, [isLive, isLoading, playerRef]);

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
          <canvas ref={canvasRef} />
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
