import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import {
  FullScreen as FullScreenSvg,
  FullScreenExit as FullScreenExitSvg,
  Pause as PauseSvg,
  Play as PlaySvg
} from '../../../assets/icons';
import './Controls.css';
import { clsm } from '../../../utils';
import { CONTROLS_BUTTON_BASE_CLASSES } from './ControlsTheme';
import RenditionSetting from './RenditionSetting';

const Controls = ({
  onControlHoverHandler,
  player,
  playerElementRef,
  selectedQualityName,
  setIsPopupOpen,
  stopPropagAndResetTimeout
}) => {
  const [isFullscreenEnabled, setIsFullscreenEnabled] = useState(false);
  const { error, isPaused, pause, play, qualities, updateQuality } = player;
  const hasError = !!error;

  const onPointerDownPlayPauseHandler = useCallback(
    (event) => {
      if (hasError) return;

      stopPropagAndResetTimeout(event);

      if (isPaused) {
        play();
      } else {
        pause();
      }
    },
    [hasError, isPaused, pause, play, stopPropagAndResetTimeout]
  );

  const onPointerDownFullscreenHandler = useCallback(
    async (event) => {
      stopPropagAndResetTimeout(event);

      if (!playerElementRef?.current) return;

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
    [isFullscreenEnabled, playerElementRef, stopPropagAndResetTimeout]
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
  }, [playerElementRef]);

  return (
    <div
      className={clsm(['flex', 'justify-between', 'w-full', 'items-center'])}
    >
      <button
        aria-label={isPaused ? 'Play the stream' : 'Pause the stream'}
        className={clsm(CONTROLS_BUTTON_BASE_CLASSES)}
        onBlur={onControlHoverHandler}
        onFocus={onControlHoverHandler}
        onMouseEnter={onControlHoverHandler}
        onMouseLeave={onControlHoverHandler}
        onPointerDown={onPointerDownPlayPauseHandler}
      >
        {isPaused ? <PlaySvg /> : <PauseSvg />}
      </button>
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
          onPointerDown={onPointerDownFullscreenHandler}
        >
          {isFullscreenEnabled ? <FullScreenExitSvg /> : <FullScreenSvg />}
        </button>
      </div>
    </div>
  );
};

Controls.defaultProps = {
  playerElementRef: null
};

Controls.propTypes = {
  onControlHoverHandler: PropTypes.func.isRequired,
  player: PropTypes.object.isRequired,
  playerElementRef: PropTypes.object,
  selectedQualityName: PropTypes.string.isRequired,
  setIsPopupOpen: PropTypes.func.isRequired,
  stopPropagAndResetTimeout: PropTypes.func.isRequired
};

export default Controls;
