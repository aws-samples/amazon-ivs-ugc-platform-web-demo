import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../../../utils';
import { NoSignal, Lock } from '../../../assets/icons';
import { player as $content } from '../../../content';
import { useChannel } from '../../../contexts/Channel';
import { useChannelView } from '../contexts/ChannelView';
import { useNotif } from '../../../contexts/Notification';
import { usePlayerContext } from '../contexts/Player';
import { useProfileViewAnimation } from '../contexts/ProfileViewAnimation';
import { useResponsiveDevice } from '../../../contexts/ResponsiveDevice';
import MobileNavbar from '../../../layouts/AppLayoutWithNavbar/Navbar/MobileNavbar';
import Notification from '../../../components/Notification';
import PlayerHeader from './PlayerHeader';
import PlayerViewerStreamActions from './PlayerViewerStreamActions';
import ProfileViewContent from './ProfileViewContent';
import ProfileViewFloatingNav from '../ProfileViewFloatingNav';
import ProfileViewHeroBanner from './ProfileViewHeroBanner';
import Spinner from '../../../components/Spinner';
import StreamInfo from './StreamInfo';
import StreamVideo from './StreamVideo';
import useFullscreen from './useFullscreen';
import usePrevious from '../../../hooks/usePrevious';
import useProfileViewPlayerAnimation from './useProfileViewPlayerAnimation';
import { usePoll } from '../../../contexts/StreamManagerActions/Poll';

const nonDoubleClickableTags = ['img', 'h3', 'button', 'svg', 'path'];
const nonDoubleClickableIds = [
  'volume-range-container',
  'rendition-selector-container'
];

const Player = ({ chatSectionRef }) => {
  const { dismissNotif, notifyError } = useNotif();
  const { isSplitView } = useChannelView();
  const { isLandscape } = useResponsiveDevice();
  const { channelData } = useChannel();
  const { avatarSrc, color, isLive, isViewerBanned, username } =
    channelData || {};
  const isChannelDataAvailable = !!channelData;

  const mobileNavBarStyleVariants = {
    default: {
      width: isLandscape ? 'calc(100vw - 384px)' : 'calc(100vw - 32px)',
      right: 'auto',
      left: '50%',
      x: '-50%'
    },
    splitChat: { width: 276, right: 16, left: 'auto', x: 0 }
  };

  /* Refs */
  const playerSectionRef = useRef();
  const bannedRef = useRef();
  const offlineRef = useRef();
  const spinnerRef = useRef();

  /* IVS Player */
  const {
    mobileClickHandler,
    player: {
      hasError,
      hasPlayedFinalBuffer,
      isLoading,
      videoAspectRatio,
      videoRef
    },
    setShouldKeepOverlaysVisible
  } = usePlayerContext();
  const { isActive: isPollActive } = usePoll();
  const [isPlayerLoading, setIsPlayerLoading] = useState(isLoading);
  const [shouldShowStream, setShouldShowStream] = useState(
    isLive !== false || hasPlayedFinalBuffer === false
  );
  const isStreamVideoVisible = shouldShowStream;
  const isStreamSpinnerVisible =
    shouldShowStream && isPlayerLoading && !isViewerBanned;
  const isStreamOfflineVisible = !shouldShowStream;
  const isStreamViewerBannedVisible = isViewerBanned;
  const isVideoVisible = shouldShowStream && !isPlayerLoading;

  /* Controls */
  const [openPopupIds, setOpenPopupIds] = useState([]);
  const isPopupOpen = !!openPopupIds.length;

  const prevIsPopupOpen = usePrevious(isPopupOpen);

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
  else if (isStreamViewerBannedVisible) targetPlayerRef = bannedRef;
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
  const { isFullscreenEnabled, onClickFullscreenHandler } =
    useFullscreen(playerSectionRef);

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

  // Keep the player overlays visible if a popup is open (e.g. volume or rendition setting popup)
  useEffect(() => {
    setShouldKeepOverlaysVisible(isPopupOpen);
  }, [setShouldKeepOverlaysVisible, isPopupOpen]);

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
    >
      <ProfileViewHeroBanner />
      <PlayerHeader avatarSrc={avatarSrc} color={color} username={username} openPopupIds={openPopupIds} />
      <StreamVideo
        ref={videoRef}
        /* Player */
        isPlayerLoading={isPlayerLoading}
        isVisible={isStreamVideoVisible}
        onClickPlayerHandler={onClickPlayerHandler}
        /* Controls */
        openPopupIds={openPopupIds}
        setOpenPopupIds={setOpenPopupIds}
        /* Fullscreen */
        isFullscreenEnabled={isFullscreenEnabled}
        onClickFullscreenHandler={onClickFullscreenHandler}
        /* Profile View Animation */
        playerProfileViewAnimationProps={playerProfileViewAnimationProps}
      />
      <StreamInfo
        isVisible={isStreamSpinnerVisible}
        playerProfileViewAnimationProps={playerProfileViewAnimationProps}
        ref={spinnerRef}
        icon={<Spinner size="large" variant="light" />}
      />
      <StreamInfo
        ref={offlineRef}
        isVisible={isStreamOfflineVisible}
        playerProfileViewAnimationProps={playerProfileViewAnimationProps}
        message={$content.stream_offline}
        icon={
          <NoSignal
            className={clsm([
              'fill-lightMode-gray-medium',
              'dark:fill-darkMode-gray-light'
            ])}
          />
        }
      />
      <StreamInfo
        ref={bannedRef}
        isVisible={isStreamViewerBannedVisible}
        playerProfileViewAnimationProps={playerProfileViewAnimationProps}
        message={$content.you_are_banned}
        icon={
          <Lock
            className={clsm([
              'fill-lightMode-gray-medium',
              'dark:fill-darkMode-gray-light'
            ])}
          />
        }
      />
      <ProfileViewContent
        targetPlayerRef={targetPlayerRef}
        playerSectionRef={playerSectionRef}
      />
      <ProfileViewFloatingNav
        className={clsm(['fixed', 'bottom-0', 'right-0'])}
      />
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
        isPollActive={isPollActive}
        isPopupOpen={isPopupOpen}
        onClickPlayerHandler={onClickPlayerHandler}
        shouldShowStream={shouldShowStream}
      />
      <Notification className="sticky" />
    </motion.section>
  );
};

Player.propTypes = {
  chatSectionRef: PropTypes.shape({ current: PropTypes.object }).isRequired
};

export default Player;
