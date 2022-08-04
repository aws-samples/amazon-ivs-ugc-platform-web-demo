import { useLocation, useMatch } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';

import './FloatingPlayer.css';
import { app as $appContent } from '../../../content';
import { Sensors } from '../../../assets/icons';
import { useStreams } from '../../../contexts/Streams';
import { useUser } from '../../../contexts/User';
import Button from '../../../components/Button';
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
  const liveSession = streamSessions?.find(
    (streamSession) => streamSession.isLive
  );
  const {
    canvasRef,
    isBlurReady,
    isLoading,
    playerRef,
    shouldBlurPlayer,
    videoRef
  } = usePlayer({
    ingestConfiguration: liveSession?.ingestConfiguration,
    isLive,
    playbackUrl: userData?.playbackUrl
  });
  const [isExpanded, setIsExpanded] = useState(true);
  const { pathname } = useLocation();
  const isSettingsPage = !!useMatch('settings');
  const hasStreamSessions = !!streamSessions?.length;
  const prevIsLiveValue = useRef(isLive);
  const shouldShowSpinner =
    (isLoading && isLive !== false) || (shouldBlurPlayer && !isBlurReady);
  const hidePlayerStyles = shouldShowSpinner
    ? { style: { display: 'none' } }
    : {};
  const setLiveActiveStreamSession = useCallback(() => {
    updateActiveStreamSession(streamSessions?.[0]);
  }, [streamSessions, updateActiveStreamSession]);

  useEffect(() => {
    if (isLive) {
      prevIsLiveValue.current = true;
    }
  }, [isLive]);

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
          <video
            {...hidePlayerStyles}
            ref={videoRef}
            autoPlay
            playsInline
            muted
          ></video>
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
                    <Button type="nav" variant="secondary" to="/settings">
                      {$content.settings}
                    </Button>
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
