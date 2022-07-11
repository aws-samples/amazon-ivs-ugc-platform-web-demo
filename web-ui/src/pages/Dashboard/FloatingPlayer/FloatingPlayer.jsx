import { useLocation, useMatch } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import './FloatingPlayer.css';
import { app as $appContent } from '../../../content';
import { Sensors } from '../../../assets/icons';
import { useStreams } from '../../../contexts/Streams';
import { useUser } from '../../../contexts/User';
import Button from '../../../components/Button';
import LinkButton from '../../../components/LinkButton';
import LivePill from '../../../components/LivePill';
import Spinner from '../../../components/Spinner';
import usePlayer from '../../../hooks/usePlayer';

const $content = $appContent.floating_player;

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
  const isSettingsPage = !!useMatch('settings');
  const hasStreamSessions = !!streamSessions?.length;
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
  const prevIsLiveValue = useRef(isLive);
  const [isBlurReady, setIsBlurReady] = useState(false);
  const shouldShowSpinner =
    (isLoading && isLive !== false) || (shouldBlurPlayer && !isBlurReady);
  const hidePlayerStyles = shouldShowSpinner
    ? { style: { display: 'none' } }
    : {};

  const setLiveActiveStreamSession = useCallback(() => {
    updateActiveStreamSession(streamSessions?.[0]);
  }, [streamSessions, updateActiveStreamSession]);

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
          setIsBlurReady(true);

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
    if (isLive) {
      prevIsLiveValue.current = true;
    }
  }, [isLive]);

  useEffect(() => {
    if (isLive && !isLoading && shouldBlurPlayer) {
      startBlur();

      return () => {
        setIsBlurReady(true);
        clearCanvas();
      };
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

  const classNames = ['mini-player-container'];
  if (isLive) classNames.push('is-live');
  if (isExpanded) classNames.push('is-expanded');

  return (
    <div className="floating-player">
      <Button
        ariaLabel={isExpanded ? $content.collapse : $content.expand}
        className="icon-button"
        onClick={() => setIsExpanded((prev) => !prev)}
        variant="secondary"
      >
        <Sensors isLive={isLive} />
      </Button>
      <div className={classNames.join(' ')}>
        <div
          className="video-container"
          style={isLive ? {} : { display: 'none' }}
        >
          {shouldShowSpinner && <Spinner variant="light" />}
          <video {...hidePlayerStyles} ref={videoRef} playsInline muted></video>
          <canvas {...hidePlayerStyles} ref={canvasRef} />
          <LivePill />
        </div>
        {isLive &&
          (activeStreamSession?.index > 0 || pathname === '/settings') && (
            <Button onClick={setLiveActiveStreamSession} variant="secondary">
              {$content.view_stream_session}
            </Button>
          )}
        {!isLive && (
          <div className="offline-stream-container">
            {hasStreamSessions ? (
              <p className="mini-player-text p2">
                {prevIsLiveValue.current
                  ? $content.stream_went_offline
                  : $content.no_current_live_stream}
              </p>
            ) : (
              <>
                <h4>{$content.no_current_live_stream}</h4>
                <p className="mini-player-text offline-instructions p2">
                  {$content.offline_instructions}
                </p>
                {!isSettingsPage && (
                  <div className="settings-link">
                    <LinkButton variant="secondary" to="/settings">
                      {$content.settings}
                    </LinkButton>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FloatingPlayer;
