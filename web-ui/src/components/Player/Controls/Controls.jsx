import { useCallback, useEffect } from 'react';
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
import VolumeSetting from './VolumeSetting';

const Controls = ({
  isFullscreenEnabled,
  onClickFullscreenHandler,
  onControlHoverHandler,
  player,
  selectedQualityName,
  setIsPopupOpen,
  stopPropagAndResetTimeout
}) => {
  const {
    isPaused,
    pause,
    play,
    qualities,
    updateQuality,
    updateVolume,
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
          onControlHoverHandler={onControlHoverHandler}
          setIsPopupOpen={setIsPopupOpen}
          stopPropagAndResetTimeout={stopPropagAndResetTimeout}
          updateVolume={updateVolume}
          volumeLevel={volumeLevel}
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
  isFullscreenEnabled: false
};

Controls.propTypes = {
  isFullscreenEnabled: PropTypes.bool,
  onClickFullscreenHandler: PropTypes.func.isRequired,
  onControlHoverHandler: PropTypes.func.isRequired,
  player: PropTypes.object.isRequired,
  selectedQualityName: PropTypes.string.isRequired,
  setIsPopupOpen: PropTypes.func.isRequired,
  stopPropagAndResetTimeout: PropTypes.func.isRequired
};

export default Controls;
