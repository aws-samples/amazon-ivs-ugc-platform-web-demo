import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { app as $appContent } from '../content';
import { clsm } from '../utils';
import { Sensors } from '../assets/icons';
import { useStreams } from '../contexts/Streams';
import { useUser } from '../contexts/User';
import { VOLUME_MIN } from '../constants';
import Button from './Button';
import LivePill from './LivePill';
import Spinner from './Spinner';
import useCurrentPage from '../hooks/useCurrentPage';
import usePlayer from '../hooks/usePlayer';
import useStreamSessionData from '../contexts/Streams/useStreamSessionData';

const $content = $appContent.floating_player;

const FloatingPlayer = () => {
  const {
    activeStreamSession,
    hasStreamSessions,
    isLive,
    setStreamSessions,
    streamSessions,
    updateActiveStreamSession
  } = useStreams();
  const liveSession = useMemo(
    () => streamSessions?.find((streamSession) => streamSession.isLive),
    [streamSessions]
  );
  const { updateStreamSessionDataFetchKey } = useStreamSessionData({
    isLive,
    isRevalidationEnabled: !liveSession?.ingestConfiguration,
    setStreamSessions,
    streamSessions
  });
  const { userData } = useUser();
  const {
    canvasRef,
    isBlurReady,
    isLoading,
    playerRef,
    shouldBlurPlayer,
    videoRef
  } = usePlayer({
    defaultVolumeLevel: VOLUME_MIN,
    ingestConfiguration: liveSession?.ingestConfiguration,
    isLive,
    playbackUrl: userData?.playbackUrl
  });
  const [isExpanded, setIsExpanded] = useState(true);
  const currentPage = useCurrentPage();
  const navigate = useNavigate();
  const shouldShowSpinner =
    (isLoading && isLive !== false) || (shouldBlurPlayer && !isBlurReady);
  const setLiveActiveStreamSession = useCallback(() => {
    updateActiveStreamSession(streamSessions?.[0]);

    if (currentPage !== 'stream_health') navigate('/health');
  }, [currentPage, navigate, streamSessions, updateActiveStreamSession]);

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

  // Try to get the ingest configuration to determine if we need to blur the sides of the player (portrait stream)
  useEffect(() => {
    if (liveSession) updateStreamSessionDataFetchKey(liveSession);
  }, [liveSession, updateStreamSessionDataFetchKey]);

  return (
    <div
      className={clsm([
        'bottom-6',
        'fixed',
        'flex-col-reverse',
        'flex',
        'items-end',
        'right-6',
        'z-[300]'
      ])}
    >
      <Button
        ariaLabel={isExpanded ? $content.collapse : $content.expand}
        className={clsm([
          'bg-lightMode-gray',
          'focus:bg-lightMode-gray',
          'h-auto',
          'hover:bg-lightMode-gray-hover',
          'min-w-0',
          'p-1.5',
          'text-black',
          'w-auto'
        ])}
        onClick={() => setIsExpanded((prev) => !prev)}
        variant="secondary"
      >
        <Sensors isLive={isLive} />
      </Button>
      <div
        className={clsm([
          'rounded-3xl',
          'border-0',
          'flex',
          'flex-col',
          'mb-2.5',
          'origin-bottom-right',
          'invisible',
          'w-52',
          'space-y-2.5',
          isLive && [
            'bg-lightMode-gray-light',
            'border-lightMode-gray-light',
            'dark:bg-darkMode-gray-medium',
            'dark:border-darkMode-gray-medium',
            'border-[10px]'
          ],
          isExpanded && 'visible'
        ])}
      >
        <div
          className={clsm([
            'aspect-video',
            'bg-black',
            'overflow-hidden',
            'relative',
            'rounded-2xl',
            !isLive && 'hidden'
          ])}
        >
          {shouldShowSpinner && (
            <Spinner
              className={clsm([
                'absolute',
                'bottom-0',
                'left-0',
                'm-auto',
                'right-0',
                'text-white',
                'top-0'
              ])}
              variant="light"
            />
          )}
          <canvas
            className={clsm([
              'absolute',
              'bottom-0',
              'h-full',
              'left-0',
              'object-cover',
              'opacity-50',
              'right-0',
              'rounded-2xl',
              'top-0',
              'w-full',
              shouldShowSpinner && 'hidden'
            ])}
            ref={canvasRef}
          />
          <video
            className={clsm([
              'absolute',
              'h-full',
              'left-0',
              'rounded-2xl',
              'top-0',
              'w-full',
              shouldShowSpinner && 'hidden'
            ])}
            ref={videoRef}
            autoPlay
            playsInline
            muted
          ></video>
          <LivePill className={clsm(['absolute', 'left-2.5', 'top-2.5'])} />
        </div>
        {isExpanded &&
          isLive &&
          (activeStreamSession?.index > 0 ||
            currentPage !== 'stream_health') && (
            <Button onClick={setLiveActiveStreamSession} variant="secondary">
              {$content.view_stream_session}
            </Button>
          )}
        {isExpanded && !isLive && hasStreamSessions !== undefined && (
          <div
            className={clsm([
              'bg-lightMode-gray-light',
              'dark:bg-darkMode-gray-medium',
              'flex-col',
              'flex',
              'p-5',
              'rounded-3xl',
              'space-y-2.5'
            ])}
          >
            {hasStreamSessions ? (
              <p className={clsm(['p2', 'tracking-normal', 'text-center'])}>
                {$content.your_channel_is_offline}
              </p>
            ) : (
              <>
                <h4>{$content.your_channel_is_offline}</h4>
                <p className={clsm(['p2', 'tracking-normal', 'text-left'])}>
                  {$content.offline_instructions}
                </p>
                {currentPage !== 'settings' && (
                  <div className="mt-2.5">
                    <Button
                      className="w-full"
                      type="nav"
                      variant="secondary"
                      to="/settings"
                    >
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
