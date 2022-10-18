import { useCallback, useEffect, useMemo } from 'react';
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
import { useResponsiveDevice } from '../../../contexts/ResponsiveDevice';
import RenditionSetting, {
  POPUP_ID as RENDITION_SETTING_POPUP_ID
} from './RenditionSetting';
import VolumeSetting, {
  POPUP_ID as VOLUME_SETTING_POPUP_ID
} from './VolumeSetting';

const Controls = ({
  handleControlsVisibility,
  isChatVisible,
  isControlsOpen,
  isFullscreenEnabled,
  isViewerBanned,
  onClickFullscreenHandler,
  openPopupIds,
  player,
  selectedQualityName,
  setOpenPopupIds,
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
    useResponsiveDevice();
  const mobileSVGOpacity = isTouchscreenDevice ? '[&>svg]:fill-white' : '';
  const isSplitView = isMobileView && isLandscape;
  const controlsVisibilityProps = useMemo(
    () => ({
      onBlur: handleControlsVisibility,
      onFocus: handleControlsVisibility,
      onMouseEnter: handleControlsVisibility,
      onMouseLeave: handleControlsVisibility
    }),
    [handleControlsVisibility]
  );
  const isVolumeSettingPopupExpanded = !!openPopupIds.find(
    (openPopupId) => openPopupId === VOLUME_SETTING_POPUP_ID
  );
  const isRenditionSettingPopupExpanded = !!openPopupIds.find(
    (openPopupId) => openPopupId === RENDITION_SETTING_POPUP_ID
  );

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
        'space-x-4'
      ])}
    >
      <div className="flex space-x-4">
        <button
          {...controlsVisibilityProps}
          aria-label={isPaused ? 'Play the stream' : 'Pause the stream'}
          className={clsm(CONTROLS_BUTTON_BASE_CLASSES, mobileSVGOpacity)}
          disabled={isViewerBanned}
          onClick={onClickPlayPauseHandler}
        >
          {isPaused ? <PlaySvg /> : <PauseSvg />}
        </button>
        <VolumeSetting
          className={clsm(mobileSVGOpacity)}
          controlsVisibilityProps={controlsVisibilityProps}
          isDisabled={isViewerBanned}
          isExpanded={isVolumeSettingPopupExpanded}
          setOpenPopupIds={setOpenPopupIds}
          stopPropagAndResetTimeout={stopPropagAndResetTimeout}
          updateVolume={updateVolume}
          volumeLevel={volumeLevel}
        />
      </div>
      <div className="flex space-x-4">
        {isSplitView && !isFullscreenEnabled && (
          // The split view toggle control remains enabled for banned viewers
          <button
            {...controlsVisibilityProps}
            aria-label={`${isChatVisible ? 'Hide' : 'Show'} chat`}
            className={clsm(CONTROLS_BUTTON_BASE_CLASSES, mobileSVGOpacity)}
            onClick={onClickToggleChat}
          >
            {isChatVisible ? <ChatOpenSVG /> : <ChatClosedSVG />}
          </button>
        )}
        <RenditionSetting
          className={clsm(mobileSVGOpacity)}
          controlsVisibilityProps={controlsVisibilityProps}
          isDisabled={isViewerBanned}
          isExpanded={isRenditionSettingPopupExpanded}
          qualities={qualities}
          selectedQualityName={selectedQualityName}
          setOpenPopupIds={setOpenPopupIds}
          stopPropagAndResetTimeout={stopPropagAndResetTimeout}
          updateQuality={updateQuality}
        />
        <button
          {...controlsVisibilityProps}
          aria-label={`${
            isFullscreenEnabled ? 'Disable' : 'Enable'
          } fullscreen mode`}
          className={clsm(CONTROLS_BUTTON_BASE_CLASSES, mobileSVGOpacity)}
          disabled={isViewerBanned}
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
  handleControlsVisibility: PropTypes.func.isRequired,
  isChatVisible: PropTypes.bool,
  isControlsOpen: PropTypes.bool,
  isFullscreenEnabled: PropTypes.bool,
  isViewerBanned: PropTypes.bool,
  onClickFullscreenHandler: PropTypes.func.isRequired,
  openPopupIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  player: PropTypes.object.isRequired,
  selectedQualityName: PropTypes.string.isRequired,
  setOpenPopupIds: PropTypes.func.isRequired,
  stopPropagAndResetTimeout: PropTypes.func.isRequired,
  toggleChat: PropTypes.func.isRequired
};

export default Controls;
