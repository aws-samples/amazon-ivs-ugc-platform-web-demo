import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import { clsm } from '../../../../../utils';
import { createAnimationProps } from '../../../../../helpers/animationPropsHelper';
import { getAvatarSrc } from '../../../../../helpers';
import { MicOff, VideoCameraOff } from '../../../../../assets/icons';
import { STAGE_VIDEO_FEEDS_TYPES } from './StageVideoFeeds';
import StageProfilePill, { STAGE_PROFILE_TYPES } from './StageProfilePill';
import Spinner from '../../../../../components/Spinner';
import {
  FULLSCREEN_ANIMATION_DURATION,
  FULLSCREEN_ANIMATION_TRANSITION,
  PARTICIPANT_TYPES
} from '../../../../../constants';

const SIZE_VARIANTS = {
  LG: 'large',
  MD: 'medium',
  SM: 'small'
};

const StageVideo = ({ type, participant, className = '' }) => {
  const {
    fullscreen,
    displayMedia: { isScreenSharing }
  } = useSelector((state) => state.streamManager);
  const { isPlayerMuted } = useSelector((state) => state.channel);
  const videoRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    mediaStream,
    videoStopped: isCameraHidden,
    audioMuted: isMicrophoneMuted,
    attributes,
    isLocal
  } = participant;
  const {
    profileColor = null,
    username = null,
    type: userType
  } = attributes || {};
  const avatarSrc = getAvatarSrc(attributes);

  const isFullscreenType = type === STAGE_VIDEO_FEEDS_TYPES.FULL_SCREEN;
  const isGoLiveType = type === STAGE_VIDEO_FEEDS_TYPES.GO_LIVE;
  const isChannelType = type === STAGE_VIDEO_FEEDS_TYPES.CHANNEL;

  const updateVideoSource = useCallback((mediaStream) => {
    videoRef.current.srcObject = mediaStream;
  }, []);

  useEffect(() => {
    if (!isChannelType || !mediaStream || !isLoading) return;

    updateVideoSource(mediaStream);
  }, [updateVideoSource, isLoading, isChannelType, mediaStream]);

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
        '@container/video',
        'grid',
        'h-full',
        'overflow-hidden',
        'relative',
        'w-full',
        'aspect-video',
        'bg-white',
        'dark:bg-black',
        isFullscreenType || isChannelType ? 'rounded-xl' : 'rounded',
        className
      ])}
    >
      <video
        ref={videoRef}
        autoPlay
        className={clsm([
          'aspect-video',
          'col-span-full',
          'object-contain',
          'row-span-full',
          'absolute',
          'top-0',
          'left-0',
          isCameraHidden ? 'hidden' : ['w-full', 'h-full']
        ])}
        playsInline
        {...(isChannelType ? { muted: isPlayerMuted } : { muted: isLocal })}
        aria-label="Local participant IVS stage video"
      >
        <track label="empty" kind="captions" srcLang="en" />
      </video>
      <AnimatePresence>
        {!isGoLiveType && (
          <motion.div
            {...createAnimationProps({
              animations: ['fadeIn-full'],
              transition: FULLSCREEN_ANIMATION_TRANSITION
            })}
            className={clsm([
              '@stage-video-lg/video:px-4',
              '@stage-video-lg/video:top-4',
              '@stage-video-xl/video:px-6',
              '@stage-video-xl/video:top-6',
              'absolute',
              'flex',
              'h-auto',
              'items-start',
              'justify-between',
              'px-3',
              'top-3',
              'w-full'
            ])}
          >
            {username && (
              <StageProfilePill
                type={STAGE_PROFILE_TYPES.FULLSCREEN_VIDEO_FEED}
                avatarSrc={avatarSrc}
                profileColor={profileColor}
                username={username}
                isScreenshare={userType === PARTICIPANT_TYPES.SCREENSHARE}
              />
            )}
            {isMicrophoneMuted && (
              <div
                className={clsm([
                  'invisible',
                  '[&>svg]:fill-white',
                  'bg-modalOverlay',
                  'flex',
                  'items-center',
                  'justify-center',
                  'rounded-full',
                  'h-6',
                  'w-6',
                  '[&>svg]:h-4',
                  '[&>svg]:w-4',
                  '@stage-video-sm/video:visible'
                ])}
              >
                <MicOff />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <div
        className={clsm([
          'bg-lightMode-gray-light',
          'dark:bg-darkMode-gray-medium',
          '[&>svg]:fill-lightMode-gray-medium',
          'dark:[&>svg]:fill-darkMode-gray-light',
          'col-span-full',
          'fill-modalOverlay',
          'flex',
          'items-center',
          'justify-center',
          'row-span-full',
          'rounded',
          isGoLiveType && isScreenSharing && ['[&>svg]:w-4', '[&>svg]:h-4'],
          isCameraHidden ? ['w-full', 'h-full'] : 'hidden'
        ])}
      >
        <VideoCameraOff />
      </div>
      {isLoading && !isCameraHidden && (
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

StageVideo.propTypes = {
  participant: PropTypes.shape({
    mediaStream: PropTypes.instanceOf(MediaStream),
    videoStopped: PropTypes.bool,
    audioMuted: PropTypes.bool,
    attributes: PropTypes.shape({
      avatar: PropTypes.string,
      channelAssetsAvatarUrl: PropTypes.string,
      participantGroup: PropTypes.oneOf(['user', 'display']),
      profileColor: PropTypes.string,
      type: PropTypes.string,
      username: PropTypes.string
    }),
    isLocal: PropTypes.bool
  }).isRequired,
  type: PropTypes.oneOf(['golive', 'fullscreen', 'channel']).isRequired,
  className: PropTypes.string
};

export default StageVideo;
