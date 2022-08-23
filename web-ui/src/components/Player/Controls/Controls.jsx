import { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';

import './Controls.css';
import {
  ChatClosed as ChatClosedSVG,
  ChatOpen as ChatOpenSVG,
  FullScreen as FullScreenSvg,
  FullScreenExit as FullScreenExitSvg,
  Pause as PauseSvg,
  Play as PlaySvg
} from '../../../assets/icons';
import { clsm } from '../../../utils';
import { CONTROLS_BUTTON_BASE_CLASSES } from './ControlsTheme';
import { useMobileBreakpoint } from '../../../contexts/MobileBreakpoint';
import RenditionSetting from './RenditionSetting';
import VolumeSetting from './VolumeSetting';

const Controls = ({
  isChatVisible,
  isControlsOpen,
  isFullscreenEnabled,
  onClickFullscreenHandler,
  onControlHoverHandler,
  player,
  selectedQualityName,
  setIsPopupOpen,
  stopPropagAndResetTimeout,
  toggleChat
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
  const { isMobileView, isLandscape } = useMobileBreakpoint();
  const isSplitView = isMobileView && isLandscape;

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

  const onClickToggleChat = useCallback(
    (event) => {
      stopPropagAndResetTimeout(event);
      toggleChat();
    },
    [stopPropagAndResetTimeout, toggleChat]
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
      className={clsm([
        'flex',
        'justify-between',
        'w-full',
        'items-center',
        'gap-x-4'
      ])}
    >
      <div className="flex gap-x-4">
        <button
          aria-label={isPaused ? 'Play the stream' : 'Pause the stream'}
          className={clsm(CONTROLS_BUTTON_BASE_CLASSES)}
          disabled={!isControlsOpen}
          onBlur={onControlHoverHandler}
          onFocus={onControlHoverHandler}
          onMouseEnter={onControlHoverHandler}
          onMouseLeave={onControlHoverHandler}
          onClick={onClickPlayPauseHandler}
        >
          {isPaused ? <PlaySvg /> : <PauseSvg />}
        </button>
        <VolumeSetting
          isDisabled={!isControlsOpen}
          onControlHoverHandler={onControlHoverHandler}
          setIsPopupOpen={setIsPopupOpen}
          stopPropagAndResetTimeout={stopPropagAndResetTimeout}
          updateVolume={updateVolume}
          volumeLevel={volumeLevel}
        />
      </div>
      <div className="flex gap-x-4">
        {isSplitView && (
          <button
            aria-label={`${isChatVisible ? 'Hide' : 'Show'} chat`}
            className={clsm(CONTROLS_BUTTON_BASE_CLASSES)}
            disabled={!isControlsOpen}
            onClick={onClickToggleChat}
          >
            {isChatVisible ? <ChatOpenSVG /> : <ChatClosedSVG />}
          </button>
        )}
        <RenditionSetting
          isDisabled={!isControlsOpen}
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
          disabled={!isControlsOpen}
          onClick={onClickFullscreenHandler}
        >
          {isFullscreenEnabled ? <FullScreenExitSvg /> : <FullScreenSvg />}
        </button>
      </div>
    </div>
  );
};

Controls.defaultProps = {
  isChatVisible: true,
  isControlsOpen: true,
  isFullscreenEnabled: false
};

Controls.propTypes = {
  isChatVisible: PropTypes.bool,
  isControlsOpen: PropTypes.bool,
  isFullscreenEnabled: PropTypes.bool,
  onClickFullscreenHandler: PropTypes.func.isRequired,
  onControlHoverHandler: PropTypes.func.isRequired,
  player: PropTypes.object.isRequired,
  selectedQualityName: PropTypes.string.isRequired,
  setIsPopupOpen: PropTypes.func.isRequired,
  stopPropagAndResetTimeout: PropTypes.func.isRequired,
  toggleChat: PropTypes.func.isRequired
};

export default Controls;
