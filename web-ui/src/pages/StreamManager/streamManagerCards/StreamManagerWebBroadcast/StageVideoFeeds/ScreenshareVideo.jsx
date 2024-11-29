import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import { clsm } from '../../../../../utils';
import { STAGE_VIDEO_FEEDS_TYPES } from './StageVideoFeeds';
import Spinner from '../../../../../components/Spinner';
import { FULLSCREEN_ANIMATION_DURATION } from '../../../../../constants';

const SIZE_VARIANTS = {
  LG: 'large',
  MD: 'medium',
  SM: 'small'
};

const ScreenshareVideo = ({ participant, type, className = '' }) => {
  const { isPlayerMuted } = useSelector((state) => state.channel);
  const { fullscreen } = useSelector((state) => state.streamManager);
  const videoRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  const { mediaStream } = participant;

  const isFullscreenType = type === STAGE_VIDEO_FEEDS_TYPES.FULL_SCREEN;
  const isGoLiveType = type === STAGE_VIDEO_FEEDS_TYPES.GO_LIVE;
  const isChannelType = type === STAGE_VIDEO_FEEDS_TYPES.CHANNEL;

  const updateVideoSource = useCallback((mediaStream) => {
    videoRef.current.srcObject = mediaStream;
  }, []);

  useEffect(() => {
    if (!mediaStream || !isLoading) return;

    updateVideoSource(mediaStream);
  }, [mediaStream, updateVideoSource, isLoading]);

  useEffect(() => {
    const videoElement = videoRef?.current;
    const handleVideoLoadingEvent = () => setIsLoading(true);
    const handleVideoLoadedEvent = () => setIsLoading(false);

    videoElement.addEventListener('loadstart', handleVideoLoadingEvent);
    videoElement.addEventListener('loadedmetadata', handleVideoLoadedEvent);

    return () => {
      videoElement.removeEventListener('loadstart', handleVideoLoadingEvent);
      videoElement.removeEventListener(
        'loadedmetadata',
        handleVideoLoadedEvent
      );
    };
  }, []);

  /**
   * Toggle video source on mount and fullscreen view open/close
   * We have two set of stage video feeds:
   * 1) go live container 2) fullscreen view
   * Only one set should have videos with source object set to streams
   */
  const toggleVideoSource = useCallback(() => {
    if (!videoRef?.current || !mediaStream) return;
    const isSrcObjectNull = fullscreen.isOpen && isGoLiveType;

    if (isSrcObjectNull) {
      videoRef.current.srcObject = null;
    } else {
      updateVideoSource(mediaStream);
    }
  }, [mediaStream, fullscreen.isOpen, isGoLiveType, updateVideoSource]);

  useEffect(() => {
    if (isChannelType) return;

    // Swith video source once fullscreen collapse animation completes
    const animationDelay = fullscreen.isOpen
      ? 0
      : FULLSCREEN_ANIMATION_DURATION * 1000;
    setTimeout(toggleVideoSource, animationDelay);

    return () => clearTimeout(toggleVideoSource);
  }, [fullscreen.isOpen, toggleVideoSource, isChannelType]);

  return (
    <div
      className={clsm([
        '@container/screenshare',
        'h-full',
        'overflow-hidden',
        'relative',
        isFullscreenType || isChannelType ? 'rounded-xl' : 'rounded',
        'w-full',
        'flex-1',
        className
      ])}
    >
      <video
        ref={videoRef}
        autoPlay
        className={clsm([
          'aspect-video',
          'col-span-full',
          'row-span-full',
          'w-full',
          'h-full'
        ])}
        playsInline
        {...(isChannelType && { muted: isPlayerMuted })}
        aria-label="Local participant IVS stage video"
      >
        <track label="empty" kind="captions" srcLang="en" />
      </video>
      {isLoading && (
        <div
          className={clsm([
            'bg-lightMode-gray-light',
            'dark:bg-darkMode-gray-medium',
            'col-span-full',
            'fill-modalOverlay',
            'flex',
            'items-center',
            'justify-center',
            'row-span-full',
            'rounded'
          ])}
        >
          <Spinner
            size={isGoLiveType ? SIZE_VARIANTS.SM : SIZE_VARIANTS.MD}
            className={clsm([
              'text-lightMode-gray-medium',
              'dark:text-darkMode-gray-light'
            ])}
          />
        </div>
      )}
    </div>
  );
};

ScreenshareVideo.propTypes = {
  type: PropTypes.oneOf(['golive', 'fullscreen', 'channel']).isRequired,
  className: PropTypes.string,
  participant: PropTypes.shape({
    id: PropTypes.string,
    attributes: PropTypes.shape({
      username: PropTypes.string,
      channelId: PropTypes.string,
      profileColor: PropTypes.string,
      type: PropTypes.string
    }),
    userId: PropTypes.string,
    videoStopped: PropTypes.bool,
    audioMuted: PropTypes.bool,
    mediaStream: PropTypes.instanceOf(MediaStream)
  }).isRequired
};

export default ScreenshareVideo;
