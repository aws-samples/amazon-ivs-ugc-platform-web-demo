import PropTypes from 'prop-types';
import { useCallback } from 'react';

import './Controls.css';
import { Pause as PauseSvg } from '../../../assets/icons';
import { Play as PlaySvg } from '../../../assets/icons';
import { Mute as MuteSvg } from '../../../assets/icons';
import { Unmute as UnmuteSvg } from '../../../assets/icons';
import { SettingsGear as SettingsGearSvg } from '../../../assets/icons'
import { FullScreen as FullScreenSvg } from '../../../assets/icons'

const Controls = ({ player, stopPropagAndResetTimeout }) => {
  const { error, isMuted, isPaused, mute, pause, play, unmute } = player;
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
  const onPointerDownMuteUnmuteHandler = useCallback(
    (event) => {
      if (hasError) return;

      stopPropagAndResetTimeout(event);

      if (isMuted) {
        unmute();
      } else {
        mute();
      }
    },
    [hasError, isMuted, mute, stopPropagAndResetTimeout, unmute]
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
          <button
            aria-disabled={hasError}
            className="player-controls-btn"
            onPointerDown={onPointerDownMuteUnmuteHandler}
          >
            {isMuted ? <MuteSvg /> : <UnmuteSvg />}
          </button>
      </div>
      <div>
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
      </div>
    </div>
  );
};

Controls.propTypes = {
  player: PropTypes.object.isRequired,
  stopPropagAndResetTimeout: PropTypes.func.isRequired
};

export default Controls;
