import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../../../utils';
import { DEFAULT_PROFILE_VIEW_TRANSITION } from '../../../constants';
import { defaultViewerStreamActionTransition } from '../ViewerStreamActions/viewerStreamActionsTheme';
import { player as $content } from '../../../content';
import { useChannel } from '../../../contexts/Channel';
import { useChannelView } from '../contexts/ChannelView';
import { useNotif } from '../../../contexts/Notification';
import { useProfileViewAnimation } from '../contexts/ProfileViewAnimation';
import { useResponsiveDevice } from '../../../contexts/ResponsiveDevice';
import { useViewerStreamActions } from '../../../contexts/ViewerStreamActions';
import FloatingNav from '../../../components/FloatingNav';
import MobileNavbar from '../../../layouts/AppLayoutWithNavbar/Navbar/MobileNavbar';
import Notification from '../../../components/Notification';
import PlayerHeader from './PlayerHeader';
import PlayerViewerStreamActions from './PlayerViewerStreamActions';
import ProfileViewContent from './ProfileViewContent';
import StreamOffline from './StreamOffline';
import StreamSpinner from './StreamSpinner';
import StreamVideo from './StreamVideo';
import useControls from './Controls/useControls';
import useFullscreen from './useFullscreen';
import usePlayer from '../../../hooks/usePlayer';
import usePrevious from '../../../hooks/usePrevious';
import useProfileViewPlayerAnimation from './useProfileViewPlayerAnimation';

const nonDoubleClickableTags = ['img', 'h3', 'button', 'svg', 'path'];
const nonDoubleClickableIds = [
  'volume-range-container',
  'rendition-selector-container'
];

const Player = ({ chatSectionRef }) => {
  const { setCurrentViewerAction } = useViewerStreamActions();
  const { dismissNotif, notifyError } = useNotif();
  const { isSplitView } = useChannelView();
  const { isLandscape } = useResponsiveDevice();
  const { channelData } = useChannel();
  const { avatarSrc, color, isLive, isViewerBanned, playbackUrl, username } =
    channelData || {};
  const isChannelDataAvailable = !!channelData;

  const mobileNavBarStyleVariants = {
    default: {
      width: isLandscape ? '50%' : 'calc(100vw - 32px)',
      right: 'auto',
      left: '50%',
      x: '-50%'
    },
    splitChat: { width: 276, right: 16, left: 'auto', x: 0 }
  };

  /* Refs */
  const offlineRef = useRef();
  const playerSectionRef = useRef();
  const spinnerRef = useRef();

  /* IVS Player */
  const onTimedMetadataHandler = useCallback(
    (metadata) => {
      setCurrentViewerAction((prevViewerAction) => {
        if (metadata && prevViewerAction?.name === metadata?.name) {
          // This is done to ensure the animations are triggered when the same action is dispatched with new data
          setTimeout(() => {
            setCurrentViewerAction({
              ...metadata,
              startTime: Date.now()
            });
          }, defaultViewerStreamActionTransition.duration * 1000);

          return null;
        }

        return { ...metadata, startTime: Date.now() };
      });
    },
    [setCurrentViewerAction]
  );
  const livePlayer = usePlayer({ playbackUrl, isLive, onTimedMetadataHandler });
  const {
    hasError,
    hasPlayedFinalBuffer,
    isLoading,
    isPaused,
    videoAspectRatio,
    videoRef
  } = livePlayer;
  const [isPlayerLoading, setIsPlayerLoading] = useState(isLoading);
  const [shouldShowStream, setShouldShowStream] = useState(
    isLive !== false || hasPlayedFinalBuffer === false
  );
  const isStreamVideoVisible = shouldShowStream;
  const isStreamSpinnerVisible =
    shouldShowStream && isPlayerLoading && !isViewerBanned;
  const isStreamOfflineVisible = !shouldShowStream;
  const isVideoVisible = shouldShowStream && !isPlayerLoading;

  /* Controls */
  const {
    handleControlsVisibility,
    isControlsOpen,
    isPopupOpen,
    mobileClickHandler,
    onMouseMoveHandler,
    openPopupIds,
    setOpenPopupIds,
    stopPropagAndResetTimeout
  } = useControls(isPaused, isViewerBanned);
  const prevIsPopupOpen = usePrevious(isPopupOpen);
  const shouldShowPlayerOverlay = hasError || isControlsOpen;

  /* Profile view player animation */
  const {
    chatAnimationControls,
    disableProfileViewAnimation,
    enableProfileViewAnimation,
    getProfileViewAnimationProps,
    isProfileViewAnimationRunning,
    isProfileViewExpanded,
    playerAnimationControls,
    shouldAnimateProfileView,
    toggleChat
  } = useProfileViewAnimation();
  const animationDuration = DEFAULT_PROFILE_VIEW_TRANSITION.duration;
  const visiblePlayerAspectRatio = isVideoVisible ? videoAspectRatio : 16 / 9;
  const playerProfileViewAnimationProps = useMemo(
    () =>
      getProfileViewAnimationProps(playerAnimationControls, {
        expanded: { borderRadius: 24, top: 340, y: 0 },
        collapsed: {
          borderRadius: 0,
          top: '50%',
          y: '-50%',
          stacked: { top: 0, y: 0 }
        }
      }),
    [getProfileViewAnimationProps, playerAnimationControls]
  );

  let targetPlayerRef = videoRef;
  if (isStreamSpinnerVisible) targetPlayerRef = spinnerRef;
  else if (isStreamOfflineVisible) targetPlayerRef = offlineRef;
  useProfileViewPlayerAnimation({
    chatSectionRef,
    hasPlayedFinalBuffer,
    isVideoVisible,
    playerSectionRef,
    targetPlayerRef,
    visiblePlayerAspectRatio
  });

  /* Fullscreen */
  const { isFullscreenEnabled, onClickFullscreenHandler } = useFullscreen({
    isLive,
    isProfileViewExpanded,
    player: livePlayer,
    playerSectionRef,
    stopPropagAndResetTimeout
  });

  /* Handlers */
  const onClickPlayerHandler = useCallback(
    (event) => {
      const { target } = event;

      // This condition ensures that the first tap on mobile closes any open popup before closing the controls with a second tap
      if (event.detail === 1 && prevIsPopupOpen && !isPopupOpen) {
        return setOpenPopupIds([]);
      } else if (event.detail === 1) {
        mobileClickHandler();
      } else if (
        event.detail === 2 &&
        !nonDoubleClickableTags.includes(target.tagName.toLowerCase()) &&
        !nonDoubleClickableIds.includes(target.id)
      ) {
        onClickFullscreenHandler(event);
      }
    },
    [
      isPopupOpen,
      mobileClickHandler,
      onClickFullscreenHandler,
      prevIsPopupOpen,
      setOpenPopupIds
    ]
  );

  /* Effects */

  // Disable the animation if we have not yet fetched channel data or if fullscreen is enabled; enable otherwise
  useEffect(() => {
    if (isChannelDataAvailable && !isFullscreenEnabled) {
      enableProfileViewAnimation();
    } else {
      disableProfileViewAnimation();
    }
  }, [
    disableProfileViewAnimation,
    enableProfileViewAnimation,
    isChannelDataAvailable,
    isFullscreenEnabled
  ]);

  // Delay player state transitions until after the animation has finished
  useEffect(() => {
    if (!isProfileViewAnimationRunning) {
      setIsPlayerLoading(isLoading);
      setShouldShowStream(isLive !== false || hasPlayedFinalBuffer === false);
    }
  }, [hasPlayedFinalBuffer, isProfileViewAnimationRunning, isLive, isLoading]);

  // Show chat when stream goes offline in landscape split view
  useEffect(() => {
    if (
      isSplitView &&
      !isProfileViewExpanded &&
      !isProfileViewAnimationRunning &&
      hasPlayedFinalBuffer
    ) {
      toggleChat({ isExpandedNext: false, skipAnimation: true });
    }
  }, [
    hasPlayedFinalBuffer,
    isProfileViewAnimationRunning,
    isProfileViewExpanded,
    isSplitView,
    toggleChat
  ]);

  // Trigger an error notification when there is an error loading the stream
  useEffect(() => {
    if (hasError) {
      notifyError($content.notification.error.error_loading_stream, {
        withTimeout: false
      });
    } else dismissNotif();
  }, [dismissNotif, hasError, notifyError]);

  return (
    <motion.section
      {...getProfileViewAnimationProps(chatAnimationControls, {
        expanded: { height: '100%', stacked: { height: '100vh' } },
        collapsed: { height: '100%' }
      })}
      className={clsm([
        'relative',
        'flex',
        'flex-col',
        'items-center',
        'justify-center',
        'max-h-screen',
        'w-full',
        'h-full',
        'z-[100]',
        'transition-colors',
        'overflow-hidden',
        'dark:bg-black',
        'lg:flex-grow',
        'lg:aspect-video',
        shouldAnimateProfileView.current ? 'duration-[400ms]' : 'duration-0',
        isProfileViewExpanded ? 'bg-white' : 'bg-lightMode-gray',
        isLandscape && ['md:aspect-auto', 'touch-screen-device:lg:aspect-auto']
      ])}
      ref={playerSectionRef}
      onMouseMove={onMouseMoveHandler}
    >
      <PlayerHeader
        avatarSrc={avatarSrc}
        color={color}
        shouldShowPlayerOverlay={
          shouldShowPlayerOverlay || isLive === false || isProfileViewExpanded
        }
        username={username}
      />
      <StreamVideo
        ref={videoRef}
        /* Player */
        isLoading={isPlayerLoading}
        isVisible={isStreamVideoVisible}
        livePlayer={livePlayer}
        onClickPlayerHandler={onClickPlayerHandler}
        shouldShowPlayerOverlay={shouldShowPlayerOverlay}
        /* Controls */
        handleControlsVisibility={handleControlsVisibility}
        isControlsOpen={isControlsOpen}
        openPopupIds={openPopupIds}
        setOpenPopupIds={setOpenPopupIds}
        stopPropagAndResetTimeout={stopPropagAndResetTimeout}
        /* Fullscreen */
        isFullscreenEnabled={isFullscreenEnabled}
        onClickFullscreenHandler={onClickFullscreenHandler}
        /* Profile View Animation */
        playerProfileViewAnimationProps={playerProfileViewAnimationProps}
      />
      <StreamSpinner
        isVisible={isStreamSpinnerVisible}
        playerProfileViewAnimationProps={playerProfileViewAnimationProps}
        ref={spinnerRef}
      />
      <StreamOffline
        isVisible={isStreamOfflineVisible}
        playerProfileViewAnimationProps={playerProfileViewAnimationProps}
        ref={offlineRef}
      />
      <ProfileViewContent targetPlayerRef={targetPlayerRef} />
      <motion.div
        className={clsm([
          'fixed',
          'bottom-0',
          'right-0',
          'z-[1000]' // z-index must match that of ProfileMenu
        ])}
        {...getProfileViewAnimationProps(chatAnimationControls, {
          expanded: {
            opacity: 1,
            visibility: 'visible',
            transition: {
              delay: animationDuration,
              duration: animationDuration / 2
            }
          },
          collapsed: {
            opacity: 0,
            transition: { duration: animationDuration / 4 },
            transitionEnd: { visibility: 'collapse' }
          }
        })}
      >
        <FloatingNav />
      </motion.div>
      <MobileNavbar
        className="z-10"
        motionProps={{
          ...getProfileViewAnimationProps(
            chatAnimationControls,
            {
              expanded: mobileNavBarStyleVariants.default,
              collapsed: {
                ...mobileNavBarStyleVariants.default,
                split: mobileNavBarStyleVariants.splitChat
              }
            },
            {
              visible: isSplitView
                ? mobileNavBarStyleVariants.splitChat
                : mobileNavBarStyleVariants.default,
              hidden: mobileNavBarStyleVariants.default
            }
          )
        }}
      />
      <PlayerViewerStreamActions
        isControlsOpen={isControlsOpen}
        onClickPlayerHandler={onClickPlayerHandler}
        shouldShowStream={shouldShowStream}
      />
      <Notification />
    </motion.section>
  );
};

Player.propTypes = {
  chatSectionRef: PropTypes.shape({ current: PropTypes.object }).isRequired
};

export default Player;
