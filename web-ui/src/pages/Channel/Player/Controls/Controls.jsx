import { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';

import {
  ChatClosed as ChatClosedSVG,
  ChatOpen as ChatOpenSVG,
  FullScreen as FullScreenSvg,
  FullScreenExit as FullScreenExitSvg,
  Pause as PauseSvg,
  Play as PlaySvg
} from '../../../../assets/icons';
import { clsm } from '../../../../utils';
import { CONTROLS_BUTTON_BASE_CLASSES } from './ControlsTheme';
import { useChannel } from '../../../../contexts/Channel';
import { useChannelView } from '../../contexts/ChannelView';
import { usePlayerContext } from '../../contexts/Player';
import { useProfileViewAnimation } from '../../contexts/ProfileViewAnimation';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import RenditionSetting, {
  POPUP_ID as RENDITION_SETTING_POPUP_ID
} from './RenditionSetting';
import VolumeSetting, {
  POPUP_ID as VOLUME_SETTING_POPUP_ID
} from './VolumeSetting';

const Controls = ({
  areControlsContained,
  isFullscreenEnabled,
  onClickFullscreenHandler,
  openPopupIds,
  selectedQualityName,
  setOpenPopupIds
}) => {
  const { isChatVisible, toggleChat } = useProfileViewAnimation();
  const { isSplitView } = useChannelView();
  const { isTouchscreenDevice } = useResponsiveDevice();
  const { channelData: { isViewerBanned } = {} } = useChannel();
  const {
    player: {
      isPaused,
      pause,
      play,
      qualities,
      updateQuality,
      updateVolume,
      volumeLevel
    },
    subscribeOverlayElement,
    stopPropagAndResetTimeout
  } = usePlayerContext();
  const mobileSVGOpacity = isTouchscreenDevice ? '[&>svg]:fill-white' : '';

  const isVolumeSettingPopupExpanded = !!openPopupIds.find(
    (openPopupId) => openPopupId === VOLUME_SETTING_POPUP_ID
  );
  const isRenditionSettingPopupExpanded = !!openPopupIds.find(
    (openPopupId) => openPopupId === RENDITION_SETTING_POPUP_ID
  );

  const subscribeOverlayControl = useCallback(
    (element) => subscribeOverlayElement(element),
    [subscribeOverlayElement]
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

  const onClickToggleChat = (event) => {
    stopPropagAndResetTimeout(event);
    toggleChat({ variant: isChatVisible ? 'hidden' : 'visible' });
  };

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
        'relative',
        'flex',
        'justify-between',
        'w-full',
        'items-center',
        'space-x-4'
      ])}
    >
      <div className="flex space-x-4">
        <button
          ref={subscribeOverlayControl}
          aria-label={isPaused ? 'Play the stream' : 'Pause the stream'}
          className={clsm(CONTROLS_BUTTON_BASE_CLASSES, mobileSVGOpacity)}
          disabled={isViewerBanned}
          onClick={onClickPlayPauseHandler}
        >
          {isPaused ? <PlaySvg /> : <PauseSvg />}
        </button>
        <VolumeSetting
          className={clsm(mobileSVGOpacity)}
          isDisabled={isViewerBanned}
          isExpanded={isVolumeSettingPopupExpanded}
          setOpenPopupIds={setOpenPopupIds}
          updateVolume={updateVolume}
          volumeLevel={volumeLevel}
        />
      </div>
      <div className="flex space-x-4">
        {isSplitView && !isFullscreenEnabled && !areControlsContained && (
          // The split view toggle control remains enabled for banned viewers
          <button
            ref={subscribeOverlayControl}
            aria-label={`${isChatVisible ? 'Hide' : 'Show'} chat`}
            className={clsm(CONTROLS_BUTTON_BASE_CLASSES, mobileSVGOpacity)}
            onClick={onClickToggleChat}
          >
            {isChatVisible ? <ChatOpenSVG /> : <ChatClosedSVG />}
          </button>
        )}
        <RenditionSetting
          className={clsm(mobileSVGOpacity)}
          isDisabled={isViewerBanned}
          isExpanded={isRenditionSettingPopupExpanded}
          qualities={qualities}
          selectedQualityName={selectedQualityName}
          setOpenPopupIds={setOpenPopupIds}
          updateQuality={updateQuality}
        />
        {!areControlsContained && (
          <button
            ref={subscribeOverlayControl}
            aria-label={`${
              isFullscreenEnabled ? 'Disable' : 'Enable'
            } fullscreen mode`}
            className={clsm(CONTROLS_BUTTON_BASE_CLASSES, mobileSVGOpacity)}
            disabled={isViewerBanned}
            onClick={onClickFullscreenHandler}
          >
            {isFullscreenEnabled ? <FullScreenExitSvg /> : <FullScreenSvg />}
          </button>
        )}
      </div>
    </div>
  );
};

Controls.propTypes = {
  areControlsContained: PropTypes.bool,
  isFullscreenEnabled: PropTypes.bool,
  onClickFullscreenHandler: PropTypes.func.isRequired,
  openPopupIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedQualityName: PropTypes.string.isRequired,
  setOpenPopupIds: PropTypes.func.isRequired
};

Controls.defaultProps = {
  areControlsContained: false,
  isFullscreenEnabled: false
};

export default Controls;
