import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';

import {
  ANIMATION_DURATION,
  ANIMATION_TRANSITION as fullscreenViewTransition,
  useBroadcastFullScreen
} from '../../../../../contexts/BroadcastFullscreen';
import { clsm } from '../../../../../utils';
import { createAnimationProps } from '../../../../../helpers/animationPropsHelper';
import { getAvatarSrc } from '../../../../../helpers';
import { MicOff, VideoCameraOff } from '../../../../../assets/icons';
import { STAGE_VIDEO_FEEDS_TYPES } from './StageVideoFeeds';
import StageProfilePill, { STAGE_PROFILE_TYPES } from './StageProfilePill';
import Spinner from '../../../../../components/Spinner';
import { useGlobalStage } from '../../../../../contexts/Stage';

const SIZE_VARIANTS = {
  LG: 'large',
  MD: 'medium',
  SM: 'small'
};

const StageVideo = ({ type, participantKey, className }) => {
  const videoRef = useRef(null);
  const { participants, isChannelStagePlayerMuted } = useGlobalStage();
  const { isFullScreenViewOpen } = useBroadcastFullScreen();
  const [isLoading, setIsLoading] = useState(true);

  const participant = participants.get(participantKey);
  const { streams, isCameraHidden, isMicrophoneMuted, attributes } =
    participant;
  const { profileColor = null, username = null } = attributes || {};
  const avatarSrc = getAvatarSrc(attributes);

  const isFullscreenType = type === STAGE_VIDEO_FEEDS_TYPES.FULL_SCREEN;
  const isGoLiveType = type === STAGE_VIDEO_FEEDS_TYPES.GO_LIVE;
  const isChannelType = type === STAGE_VIDEO_FEEDS_TYPES.CHANNEL;

  const updateVideoSource = useCallback((streams) => {
    videoRef.current.srcObject = new MediaStream(
      streams.map((stream) => stream.mediaStreamTrack)
    );
  }, []);

  useEffect(() => {
    if (!streams || !isLoading) return;

    updateVideoSource(streams);
  }, [streams, updateVideoSource, isLoading]);

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
    if (!videoRef?.current || !streams) return;
    const isSrcObjectNull = isFullScreenViewOpen && isGoLiveType;

    if (isSrcObjectNull) {
      videoRef.current.srcObject = null;
    } else {
      updateVideoSource(streams);
    }
  }, [streams, isFullScreenViewOpen, isGoLiveType, updateVideoSource]);

  useEffect(() => {
    if (isChannelType) return;

    // Swith video source once fullscreen collapse animation completes
    const animationDelay = isFullScreenViewOpen ? 0 : ANIMATION_DURATION * 1000;
    setTimeout(toggleVideoSource, animationDelay);

    return () => clearTimeout(toggleVideoSource);
  }, [isFullScreenViewOpen, toggleVideoSource, isChannelType]);

  return (
    <div
      className={clsm([
        '@container/video',
        'grid',
        'h-full',
        'overflow-hidden',
        'relative',
        isFullscreenType || isChannelType ? 'rounded-xl' : 'rounded',
        'w-full',
        'aspect-video',
        className
      ])}
    >
      <video
        ref={videoRef}
        autoPlay
        className={clsm([
          'aspect-video',
          'col-span-full',
          'object-cover',
          'row-span-full',
          isCameraHidden ? 'hidden' : ['w-full', 'h-full']
        ])}
        playsInline
        {...(isChannelType && { muted: isChannelStagePlayerMuted })}
        aria-label="Local participant IVS stage video"
      >
        <track label="empty" kind="captions" srcLang="en" />
      </video>
      <AnimatePresence>
        {!isGoLiveType && (
          <motion.div
            {...createAnimationProps({
              animations: ['fadeIn-full'],
              transition: fullscreenViewTransition
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
            {profileColor && username && (
              <StageProfilePill
                type={STAGE_PROFILE_TYPES.FULLSCREEN_VIDEO_FEED}
                avatarSrc={avatarSrc}
                profileColor={profileColor}
                username={username}
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

StageVideo.defaultProps = {
  className: ''
};

StageVideo.propTypes = {
  participantKey: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['golive', 'fullscreen', 'channel']).isRequired,
  className: PropTypes.string
};

export default StageVideo;
