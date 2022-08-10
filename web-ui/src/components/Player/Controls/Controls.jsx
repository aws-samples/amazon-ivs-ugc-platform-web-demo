import { useCallback } from 'react';
import PropTypes from 'prop-types';

import {
  FullScreen as FullScreenSvg,
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
  stopPropagAndResetTimeout
}) => {
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
          stopPropagAndResetTimeout={stopPropagAndResetTimeout}
          updateQuality={updateQuality}
        />
        {/* The full screen functionality will be implemented in a subsequent iteration. The button is there to help positioning the rendition control module. */}
        <button
          className={clsm(CONTROLS_BUTTON_BASE_CLASSES)}
          onPointerDown={stopPropagAndResetTimeout}
        >
          {<FullScreenSvg />}
        </button>
      </div>
    </div>
  );
};

Controls.propTypes = {
  player: PropTypes.object.isRequired,
  stopPropagAndResetTimeout: PropTypes.func.isRequired,
  onControlHoverHandler: PropTypes.func.isRequired
};

export default Controls;
