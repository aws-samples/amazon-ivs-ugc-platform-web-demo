import { m } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import './Controls/Controls.css';
import { clsm } from '../../utils';
import { NoSignal as NoSignalSvg } from '../../assets/icons';
import { player as $content } from '../../content';
import { PLAYER_OVERLAY_CLASSES } from './PlayerTheme';
import { useNotif } from '../../contexts/Notification';
import Controls from './Controls';
import Notification from '../Notification';
import PlayerHeader from './PlayerHeader';
import Spinner from '../Spinner';
import useControls from './Controls/useControls';
import useFullscreen from './useFullscreen';
import usePlayer from '../../hooks/usePlayer';
import { useMobileBreakpoint } from '../../contexts/MobileBreakpoint';

const Player = ({ isChatVisible, toggleChat, channelData }) => {
  const {
    avatar,
    color,
    isLive: isChannelLive,
    isViewerBanned,
    playbackUrl,
    username
  } = channelData || {};

  const playerElementRef = useRef();
  const [isLive, setIsLive] = useState();
  const livePlayer = usePlayer({ playbackUrl, isLive });
  const { isLandscape, isMobileView } = useMobileBreakpoint();
  const {
    error,
    hasEnded,
    hasFinalBuffer,
    isLoading,
    isPaused,
    selectedQualityName,
    videoRef
  } = livePlayer;
  const {
    isControlsOpen,
    isFullscreenEnabled,
    mobileClickHandler,
    onControlHoverHandler,
    onMouseMoveHandler,
    setIsFullscreenEnabled,
    setIsPopupOpen,
    stopPropagAndResetTimeout
  } = useControls(isPaused, isViewerBanned);
  const { dismissNotif, notifyError } = useNotif();
  const { onClickFullscreenHandler } = useFullscreen({
    isFullscreenEnabled,
    player: livePlayer,
    playerElementRef,
    setIsFullscreenEnabled,
    stopPropagAndResetTimeout
  });

  const hasError = !!error;
  const isChannelAvailable = !!channelData;
  const isSplitView = isMobileView && isLandscape;
  const shouldShowLoader = isLoading && !hasError && !isViewerBanned;
  const shouldShowPlayerOverlay = hasError || isControlsOpen;

  const onClickPlayerHandler = useCallback(
    (event) => {
      if (event.detail === 1) mobileClickHandler(event);
      else if (event.detail === 2) onClickFullscreenHandler(event);
    },
    [mobileClickHandler, onClickFullscreenHandler]
  );

  useEffect(() => {
    if (isChannelAvailable) setIsLive(isChannelLive);
  }, [isChannelAvailable, isChannelLive]);

  // Show chat when stream goes offline in split view
  useEffect(() => {
    if (isSplitView && !isLive) {
      toggleChat({ value: true, skipAnimation: true });
    }
  }, [isLive, isSplitView, toggleChat]);

  useEffect(() => {
    if (hasEnded) {
      setIsLive(false);
    }
  }, [hasEnded, setIsLive]);

  useEffect(() => {
    if (hasError) {
      notifyError($content.notification.error.error_loading_stream, false);
    } else {
      dismissNotif();
    }
  }, [dismissNotif, hasError, notifyError]);

  return (
    <section
      className={clsm([
        'relative',
        'flex',
        'flex-col',
        'items-center',
        'justify-center',
        'w-full',
        'h-full',
        'max-h-screen',
        'bg-lightMode-gray',
        'dark:bg-black',
        'lg:aspect-video',
        'md:landscape:aspect-auto',
        'touch-screen-device:lg:landscape:aspect-auto'
      ])}
      ref={playerElementRef}
      onMouseMove={onMouseMoveHandler}
    >
      <Notification />
      {isLive || isLive === undefined || hasFinalBuffer ? (
        <>
          {shouldShowLoader && (
            <div
              className={clsm([
                'absolute',
                'top-1/2',
                '-translate-y-1/2',
                'z-10'
              ])}
            >
              <Spinner size="large" variant="light" />
            </div>
          )}
          {/* The onClick is only used on touchscreen, where the keyboard isn't available */}
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
          <div
            className={clsm([
              'absolute',
              'top-0',
              'w-full',
              'h-full',
              'max-h-screen',
              'portrait:md:max-h-[calc(calc(var(--mobile-vh,1vh)_*_100)_-_112px)]'
            ])}
            onClick={onClickPlayerHandler}
            role="toolbar"
          >
            {isChannelAvailable && (
              <PlayerHeader
                username={username}
                color={color}
                avatar={avatar}
                shouldShowPlayerOverlay={shouldShowPlayerOverlay}
              />
            )}
            <video
              className={clsm(
                ['w-full', 'h-full'],
                shouldShowLoader || isViewerBanned ? 'hidden' : 'block'
              )}
              muted
              playsInline
              ref={videoRef}
            />
            <m.div
              animate={shouldShowPlayerOverlay ? 'visible' : 'hidden'}
              initial="hidden"
              exit="hidden"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1 }
              }}
              className={clsm([
                PLAYER_OVERLAY_CLASSES,
                'player-controls-container',
                'px-10',
                'lg:px-6',
                'lg:pb-6',
                'pb-10',
                'bottom-0'
              ])}
              transition={{ duration: 0.25, type: 'tween' }}
            >
              <Controls
                isChatVisible={isChatVisible}
                isControlsOpen={isControlsOpen}
                isFullscreenEnabled={isFullscreenEnabled}
                isViewerBanned={isViewerBanned}
                onClickFullscreenHandler={onClickFullscreenHandler}
                onControlHoverHandler={onControlHoverHandler}
                player={livePlayer}
                selectedQualityName={selectedQualityName}
                setIsPopupOpen={setIsPopupOpen}
                stopPropagAndResetTimeout={stopPropagAndResetTimeout}
                toggleChat={toggleChat}
              />
            </m.div>
          </div>
        </>
      ) : (
        <div
          className={clsm([
            'flex',
            'flex-col',
            'justify-center',
            'items-center',
            'gap-y-2',
            'absolute',
            'w-full',
            'h-full',
            'left-0',
            'bottom-0',
            'z-10'
          ])}
        >
          <NoSignalSvg
            className={clsm([
              'fill-lightMode-gray-medium',
              'dark:fill-darkMode-gray'
            ])}
          />
          <h2
            className={clsm([
              'text-lightMode-gray-medium',
              'dark:text-darkMode-gray'
            ])}
          >
            {$content.stream_offline}
          </h2>
        </div>
      )}
    </section>
  );
};

Player.propTypes = {
  isChatVisible: PropTypes.bool,
  toggleChat: PropTypes.func.isRequired,
  channelData: PropTypes.object
};

Player.defaultProps = {
  isChatVisible: true,
  channelData: null
};

export default Player;
