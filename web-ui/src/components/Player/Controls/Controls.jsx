import PropTypes from 'prop-types';
import { useCallback } from 'react';

import './Controls.css';
import { Pause as PauseSvg } from '../../../assets/icons';
import { Play as PlaySvg } from '../../../assets/icons';

const Controls = ({ player, stopPropagAndResetTimeout }) => {
  const { error, isPaused, pause, play } = player;
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
    <div className="player-controls-btn-container">
      <div>
        <button
          aria-disabled={hasError}
          className="player-controls-btn play-pause-btn"
          onPointerDown={onPointerDownPlayPauseHandler}
        >
          {isPaused ? <PlaySvg /> : <PauseSvg />}
        </button>
      </div>
      {/* Settings Gear and full screen willl done in the next iteration */}
      {/* <div>
      <button
            aria-disabled={hasError}
            className="player-controls-btn play-pause-btn"
            onPointerDown={()=>{}}
          >
            {<SettingsGearSvg />}
          </button>
          <button
            aria-disabled={hasError}
            className="player-controls-btn"
            onPointerDown={()=>{}}
          >
            {<FullScreenSvg />}
          </button>
      </div> */}
    </div>
  );
};

Controls.propTypes = {
  player: PropTypes.object.isRequired,
  stopPropagAndResetTimeout: PropTypes.func.isRequired
};

export default Controls;
