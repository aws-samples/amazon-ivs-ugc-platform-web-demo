import { m } from 'framer-motion';
import { useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../../utils';
import { NoSignal as NoSignalSvg } from '../../assets/icons';
import { player as $content } from '../../content';
import { useNotif } from '../../contexts/Notification';
import Controls from './Controls';
import Spinner from '../Spinner';
import useControls from './Controls/useControls';
import useFullscreen from './useFullscreen';
import usePlayer from '../../hooks/usePlayer';
import Notification from '../Notification';

const Player = ({
  isLive,
  setIsLive,
  playbackUrl,
  isChatVisible,
  toggleChat
}) => {
  const livePlayer = usePlayer({ playbackUrl, isLive });
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
  } = useControls(isPaused);
  const playerElementRef = useRef();
  const hasError = !!error;
  const shouldShowLoader = isLoading && !hasError;
  const shouldShowControls = hasError || isControlsOpen;
  const { dismissNotif, notifyError } = useNotif();
  const { onClickFullscreenHandler } = useFullscreen({
    isFullscreenEnabled,
    player: livePlayer,
    playerElementRef,
    setIsFullscreenEnabled,
    stopPropagAndResetTimeout
  });

  const onClickPlayerHandler = useCallback(
    (event) => {
      if (event.detail === 1) mobileClickHandler(event);
      else if (event.detail === 2) onClickFullscreenHandler(event);
    },
    [mobileClickHandler, onClickFullscreenHandler]
  );

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
            <Spinner className="z-10" size="large" variant="light" />
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
            id="player-controls-container"
            onClick={onClickPlayerHandler}
            role="toolbar"
          >
            <video
              className={clsm(
                ['w-full', 'h-full'],
                shouldShowLoader ? 'hidden' : 'block'
              )}
              muted
              playsInline
              ref={videoRef}
            />
            <m.div
              animate={shouldShowControls ? 'visible' : 'hidden'}
              initial="hidden"
              exit="hidden"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1 }
              }}
              className={clsm([
                'player-controls-container',
                'flex',
                'items-end',
                'h-32',
                'px-10',
                'pt-0',
                'lg:px-6',
                'lg:pb-6',
                'pb-10',
                'absolute',
                'bottom-0',
                'left-0',
                'w-full'
              ])}
              transition={{ duration: 0.25, type: 'tween' }}
            >
              <Controls
                isChatVisible={isChatVisible}
                isControlsOpen={isControlsOpen}
                isFullscreenEnabled={isFullscreenEnabled}
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
  playbackUrl: PropTypes.string,
  isLive: PropTypes.bool,
  setIsLive: PropTypes.func.isRequired,
  isChatVisible: PropTypes.bool,
  toggleChat: PropTypes.func.isRequired
};

Player.defaultProps = {
  isLive: undefined,
  isChatVisible: true,
  playbackUrl: ''
};

export default Player;
