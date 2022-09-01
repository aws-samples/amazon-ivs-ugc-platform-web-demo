import { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';

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
  isViewerBanned,
  onClickFullscreenHandler,
  onControlHoverHandler,
  onTabbingHandler,
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
  const { isMobileView, isLandscape, isTouchscreenDevice } =
    useMobileBreakpoint();

  const mobileSVGOpacity = isTouchscreenDevice ? '[&>svg]:fill-white' : '';

  const isSplitView = isMobileView && isLandscape;
  const isControlDisabled = !isControlsOpen || isViewerBanned;

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
     * This function implements the space bar shortcut to pause or resume playback and
     * also enables tabbing and shift tabbing for the player
     */
    const onKeyDownHandler = (event) => {
      if (
        event.code === 'Tab' ||
        event.code === 'ShiftLeft' ||
        event.key === 'Shift' ||
        event.key === 'Tab'
      )
        onTabbingHandler(event);

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
  }, [isPaused, pause, play, onTabbingHandler]);

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
      <div className="flex gap-x-8">
        <button
          aria-label={isPaused ? 'Play the stream' : 'Pause the stream'}
          className={clsm(CONTROLS_BUTTON_BASE_CLASSES, mobileSVGOpacity)}
          disabled={isControlDisabled}
          onBlur={onControlHoverHandler}
          onFocus={onControlHoverHandler}
          onMouseEnter={onControlHoverHandler}
          onMouseLeave={onControlHoverHandler}
          onClick={onClickPlayPauseHandler}
        >
          {isPaused ? <PlaySvg /> : <PauseSvg />}
        </button>
        <VolumeSetting
          className={clsm(mobileSVGOpacity)}
          isDisabled={isControlDisabled}
          onControlHoverHandler={onControlHoverHandler}
          setIsPopupOpen={setIsPopupOpen}
          stopPropagAndResetTimeout={stopPropagAndResetTimeout}
          updateVolume={updateVolume}
          volumeLevel={volumeLevel}
        />
      </div>
      <div className="flex gap-x-8">
        {isSplitView && (
          <button
            aria-label={`${isChatVisible ? 'Hide' : 'Show'} chat`}
            className={clsm(CONTROLS_BUTTON_BASE_CLASSES, mobileSVGOpacity)}
            disabled={isControlDisabled} // The split view toggle control remains enabled for banned viewers
            onClick={onClickToggleChat}
          >
            {isChatVisible ? <ChatOpenSVG /> : <ChatClosedSVG />}
          </button>
        )}
        <RenditionSetting
          className={clsm(mobileSVGOpacity)}
          isDisabled={isControlDisabled}
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
          className={clsm(CONTROLS_BUTTON_BASE_CLASSES, mobileSVGOpacity)}
          disabled={isControlDisabled}
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
  isFullscreenEnabled: false,
  isViewerBanned: false
};

Controls.propTypes = {
  isChatVisible: PropTypes.bool,
  isViewerBanned: PropTypes.bool,
  isControlsOpen: PropTypes.bool,
  isFullscreenEnabled: PropTypes.bool,
  onClickFullscreenHandler: PropTypes.func.isRequired,
  onControlHoverHandler: PropTypes.func.isRequired,
  onTabbingHandler: PropTypes.func.isRequired,
  player: PropTypes.object.isRequired,
  selectedQualityName: PropTypes.string.isRequired,
  setIsPopupOpen: PropTypes.func.isRequired,
  stopPropagAndResetTimeout: PropTypes.func.isRequired,
  toggleChat: PropTypes.func.isRequired
};

export default Controls;
