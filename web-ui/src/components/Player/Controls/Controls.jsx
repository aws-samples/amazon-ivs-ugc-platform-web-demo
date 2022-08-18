import { useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import {
  FullScreen as FullScreenSvg,
  FullScreenExit as FullScreenExitSvg,
  Pause as PauseSvg,
  Play as PlaySvg
} from '../../../assets/icons';
import './Controls.css';
import { clsm, isiOS } from '../../../utils';
import { CONTROLS_BUTTON_BASE_CLASSES } from './ControlsTheme';
import { VOLUME_MAX, VOLUME_MIN } from '../../../constants';
import RenditionSetting from './RenditionSetting';
import VolumeSetting from './VolumeSetting';

const Controls = ({
  isFullscreenEnabled,
  onControlHoverHandler,
  player,
  playerElementRef,
  selectedQualityName,
  setIsFullscreenEnabled,
  setIsPopupOpen,
  stopPropagAndResetTimeout
}) => {
  const iOsFullscreenIntervalId = useRef(null);
  const {
    isPaused,
    pause,
    play,
    playerRef,
    qualities,
    updateQuality,
    updateVolume,
    videoRef,
    volumeLevel
  } = player;

  const onClickPlayPauseHandler = useCallback(
    (event) => {
      stopPropagAndResetTimeout(event);

      if (isPaused) {
        play();
      } else {
        pause();
      }
    },
    [isPaused, pause, play, stopPropagAndResetTimeout]
  );

  const onClickFullscreenHandler = useCallback(
    async (event) => {
      stopPropagAndResetTimeout(event);

      if (!playerElementRef?.current) return;

      /**
       * On iOS devices, the Fullscreen API isn't available.
       * We can only go fullscreen on the video element and use the default iOS controls.
       */
      if (isiOS() && videoRef?.current) {
        videoRef.current.webkitEnterFullscreen();
        setIsFullscreenEnabled(true);

        iOsFullscreenIntervalId.current = setInterval(() => {
          if (!videoRef?.current?.webkitDisplayingFullscreen) {
            clearInterval(iOsFullscreenIntervalId.current);
            iOsFullscreenIntervalId.current = null;

            setIsFullscreenEnabled(false);

            /**
             * Because we can't use the custom controls while in fullscreen mode,
             * we have to update the React state when exiting fullscreen mode.
             */
            if (playerRef.current.isPaused()) pause();
            else play();

            // iOS only supports mute/unmute so the volume is always 100 or 0 after exiting fullscreen mode
            if (playerRef.current.isMuted()) updateVolume(VOLUME_MIN);
            else updateVolume(VOLUME_MAX);
          }
        }, 100);

        return;
      }

      try {
        if (!isFullscreenEnabled) {
          if (playerElementRef.current.requestFullscreen)
            await playerElementRef.current.requestFullscreen();
          /**
           * Safari specific behavior:
           * webkitRequestFullscreen needs to be called on the element directly and does not return a Promise
           */ else if (playerElementRef.current.webkitRequestFullscreen)
            playerElementRef.current.webkitRequestFullscreen();
        } else {
          if (document.exitFullscreen) await document.exitFullscreen();
          else if (document.webkitExitFullscreen)
            /**
             * Safari specific behavior:
             * webkitExitFullscreen does not return a Promise
             */
            document.webkitExitFullscreen();
        }
      } catch (error) {
        // Unlikely, user has manually disabled fullscreen API
      }
    },
    [
      isFullscreenEnabled,
      pause,
      play,
      playerElementRef,
      playerRef,
      setIsFullscreenEnabled,
      stopPropagAndResetTimeout,
      updateVolume,
      videoRef
    ]
  );

  useEffect(() => {
    if (playerElementRef?.current) {
      const currentPlayerElementRef = playerElementRef.current;
      /**
       * Because Safari doesn't return a Promise after completing webkitRequestFullscreen or webkitExitFullscreen,
       * we set isFullscreenEnabled on fullscreenchange event instead.
       * The same logic is implemented here for other browsers for consistency.
       */
      const onFullscreenChange = () =>
        setIsFullscreenEnabled(
          !!(document.fullscreenElement || document.webkitFullscreenElement)
        );

      currentPlayerElementRef.addEventListener(
        'fullscreenchange',
        onFullscreenChange
      );
      currentPlayerElementRef.addEventListener(
        'webkitfullscreenchange',
        onFullscreenChange
      );

      return () => {
        currentPlayerElementRef.removeEventListener(
          'fullscreenchange',
          onFullscreenChange
        );
        currentPlayerElementRef.removeEventListener(
          'webkitfullscreenchange',
          onFullscreenChange
        );
      };
    }
  }, [playerElementRef, setIsFullscreenEnabled]);

  useEffect(() => {
    /**
     * This function implements the space bar shortcut to pause or resume playback
     */
    const onKeyDownHandler = (event) => {
      if (event.code !== 'Space' && event.key !== ' ') return;

      if (
        !document.activeElement ||
        ['BODY', 'VIDEO'].includes(document.activeElement.tagName)
      ) {
        if (isPaused) {
          play();
        } else {
          pause();
        }
      }
    };

    window.addEventListener('keydown', onKeyDownHandler);

    return () => window.removeEventListener('keydown', onKeyDownHandler);
  }, [isPaused, pause, play]);

  return (
    <div
      className={clsm(['flex', 'justify-between', 'w-full', 'items-center'])}
    >
      <div className="flex gap-x-4">
        <button
          aria-label={isPaused ? 'Play the stream' : 'Pause the stream'}
          className={clsm(CONTROLS_BUTTON_BASE_CLASSES)}
          onBlur={onControlHoverHandler}
          onFocus={onControlHoverHandler}
          onMouseEnter={onControlHoverHandler}
          onMouseLeave={onControlHoverHandler}
          onClick={onClickPlayPauseHandler}
        >
          {isPaused ? <PlaySvg /> : <PauseSvg />}
        </button>
        <VolumeSetting
          volumeLevel={volumeLevel}
          stopPropagAndResetTimeout={stopPropagAndResetTimeout}
          updateVolume={updateVolume}
          onControlHoverHandler={onControlHoverHandler}
        />
      </div>
      <div className="flex gap-x-4">
        <RenditionSetting
          onControlHoverHandler={onControlHoverHandler}
          qualities={qualities}
          selectedQualityName={selectedQualityName}
          setIsPopupOpen={setIsPopupOpen}
          stopPropagAndResetTimeout={stopPropagAndResetTimeout}
          updateQuality={updateQuality}
        />
        <button
          aria-label={`${
            isFullscreenEnabled ? 'Disable' : 'Enable'
          } fullscreen mode`}
          className={clsm(CONTROLS_BUTTON_BASE_CLASSES)}
          onClick={onClickFullscreenHandler}
        >
          {isFullscreenEnabled ? <FullScreenExitSvg /> : <FullScreenSvg />}
        </button>
      </div>
    </div>
  );
};

Controls.defaultProps = {
  isFullscreenEnabled: false,
  playerElementRef: null
};

Controls.propTypes = {
  isFullscreenEnabled: PropTypes.bool,
  onControlHoverHandler: PropTypes.func.isRequired,
  player: PropTypes.object.isRequired,
  playerElementRef: PropTypes.object,
  selectedQualityName: PropTypes.string.isRequired,
  setIsFullscreenEnabled: PropTypes.func.isRequired,
  setIsPopupOpen: PropTypes.func.isRequired,
  stopPropagAndResetTimeout: PropTypes.func.isRequired
};

export default Controls;
