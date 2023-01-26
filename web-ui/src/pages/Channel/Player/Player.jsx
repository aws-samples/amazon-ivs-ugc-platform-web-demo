import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../../../utils';
import { DEFAULT_PROFILE_VIEW_TRANSITION } from '../../../constants';
import { defaultViewerStreamActionTransition } from '../ViewerStreamActions/viewerStreamActionsTheme';
import { player as $content } from '../../../content';
import { useChannel } from '../../../contexts/Channel';
import { useNotif } from '../../../contexts/Notification';
import { useResponsiveDevice } from '../../../contexts/ResponsiveDevice';
import { useViewerStreamActions } from '../../../contexts/ViewerStreamActions';
import Notification from '../../../components/Notification';
import PlayerHeader from './PlayerHeader';
import PlayerViewerStreamActions from './PlayerViewerStreamActions';
import ProfileContent from './ProfileContent';
import StreamOffline from './StreamOffline';
import StreamSpinner from './StreamSpinner';
import StreamVideo from './StreamVideo';
import useControls from './Controls/useControls';
import useFullscreen from './useFullscreen';
import usePlayer from '../../../hooks/usePlayer';
import usePrevious from '../../../hooks/usePrevious';
import useProfileViewPlayerAnimation from './useProfileViewPlayerAnimation';
import useThrottledCallback from '../../../hooks/useThrottledCallback';

const nonDoubleClickableTags = ['img', 'h3', 'button', 'svg', 'path'];
const nonDoubleClickableIds = [
  'volume-range-container',
  'rendition-selector-container'
];

const Player = ({ isChatVisible, toggleChat }) => {
  const { channelData } = useChannel();
  const { avatarSrc, color, isLive, isViewerBanned, playbackUrl, username } =
    channelData || {};
  const { dismissNotif, notifyError } = useNotif();
  const { isLandscape, isMobileView } = useResponsiveDevice();
  const { setCurrentViewerAction } = useViewerStreamActions();
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  const offlineRef = useRef();
  const playerSectionRef = useRef();
  const spinnerRef = useRef();

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

  let targetRef = videoRef;
  if (shouldShowStream && isPlayerLoading) targetRef = spinnerRef;
  else if (!shouldShowStream) targetRef = offlineRef;
  const { isProfileViewAnimationRunning, playerAnimationControls } =
    useProfileViewPlayerAnimation({
      hasPlayedFinalBuffer,
      isLoading: isPlayerLoading,
      isProfileExpanded,
      playerSectionRef,
      shouldShowStream,
      targetRef,
      videoAspectRatio
    });
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
  const { isFullscreenEnabled, onClickFullscreenHandler } = useFullscreen({
    isLive,
    isProfileExpanded,
    player: livePlayer,
    playerSectionRef,
    stopPropagAndResetTimeout
  });

  const isChannelDataAvailable = !!channelData;
  const isProfileViewAnimationEnabled =
    isChannelDataAvailable && !isFullscreenEnabled;
  const isSplitView = isMobileView && isLandscape;
  const prevIsPopupOpen = usePrevious(isPopupOpen);
  const shouldShowPlayerOverlay = hasError || isControlsOpen;

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

  const toggleProfileView = useThrottledCallback(
    () => {
      if (!isProfileViewAnimationEnabled) return;

      setIsProfileExpanded((prev) => {
        toggleChat({ value: prev });

        return !prev;
      });
    },
    DEFAULT_PROFILE_VIEW_TRANSITION.duration * 1000 + 100,
    [isProfileViewAnimationEnabled, toggleChat]
  );

  // Delay player state transitions until after the animation has finished
  useEffect(() => {
    if (!isProfileViewAnimationRunning) {
      setIsPlayerLoading(isLoading);
      setShouldShowStream(isLive !== false || hasPlayedFinalBuffer === false);
    }
  }, [hasPlayedFinalBuffer, isProfileViewAnimationRunning, isLive, isLoading]);

  // Show chat when stream goes offline in landscape split view
  useEffect(() => {
    if (isSplitView && !isLive) {
      toggleChat({ value: true, skipAnimation: true });
    }
  }, [isLive, isSplitView, toggleChat]);

  // Trigger an error notification when there is an error loading the stream
  useEffect(() => {
    if (hasError) {
      notifyError($content.notification.error.error_loading_stream, {
        withTimeout: false
      });
    } else dismissNotif();
  }, [dismissNotif, hasError, notifyError]);

  return (
    <section
      className={clsm([
        'flex',
        'flex-col',
        'h-full',
        'items-center',
        'justify-center',
        'lg:aspect-video',
        'max-h-screen',
        'relative',
        'w-full',
        'z-[100]',
        'transition-colors',
        'duration-[400ms]',
        'dark:bg-black',
        'overflow-hidden',
        isProfileExpanded ? 'bg-white' : 'bg-lightMode-gray',
        isLandscape && ['md:aspect-auto', 'touch-screen-device:lg:aspect-auto']
      ])}
      ref={playerSectionRef}
      onMouseMove={onMouseMoveHandler}
    >
      <PlayerHeader
        avatarSrc={avatarSrc}
        color={color}
        isProfileViewAnimationRunning={isProfileViewAnimationRunning}
        isProfileViewAnimationEnabled={isProfileViewAnimationEnabled}
        isProfileExpanded={isProfileExpanded}
        shouldShowPlayerOverlay={
          shouldShowPlayerOverlay || isLive === false || isProfileExpanded
        }
        toggleProfileView={toggleProfileView}
        username={username}
      />
      <StreamVideo
        ref={videoRef}
        /* Player */
        isLoading={isPlayerLoading}
        isVisible={shouldShowStream}
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
        /* Chat */
        isChatVisible={isChatVisible}
        toggleChat={toggleChat}
        /* Profile View */
        isProfileExpanded={isProfileExpanded}
        playerAnimationControls={playerAnimationControls}
      />
      <StreamSpinner
        isProfileExpanded={isProfileExpanded}
        isVisible={shouldShowStream && isPlayerLoading && !isViewerBanned}
        playerAnimationControls={playerAnimationControls}
        ref={spinnerRef}
      />
      <StreamOffline
        isProfileExpanded={isProfileExpanded}
        isVisible={!shouldShowStream}
        playerAnimationControls={playerAnimationControls}
        ref={offlineRef}
      />
      <ProfileContent
        isProfileExpanded={isProfileExpanded}
        offlineRef={offlineRef}
        spinnerRef={spinnerRef}
        videoRef={videoRef}
      />
      <PlayerViewerStreamActions
        isControlsOpen={isControlsOpen}
        onClickPlayerHandler={onClickPlayerHandler}
        shouldShowStream={shouldShowStream}
      />
      <Notification />
    </section>
  );
};

Player.propTypes = {
  isChatVisible: PropTypes.bool,
  toggleChat: PropTypes.func.isRequired
};

Player.defaultProps = { isChatVisible: true };

export default Player;
