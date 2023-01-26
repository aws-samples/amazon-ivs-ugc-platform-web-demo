import { motion } from 'framer-motion';
import { forwardRef, useCallback } from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../../../utils';
import { useChannel } from '../../../contexts/Channel';
import Controls from './Controls';
import PlayerOverlay from './PlayerOverlay';

const StreamVideo = forwardRef(
  (
    {
      handleControlsVisibility,
      isChatVisible,
      isControlsOpen,
      isFullscreenEnabled,
      isProfileExpanded,
      isLoading,
      isVisible,
      livePlayer,
      onClickFullscreenHandler,
      onClickPlayerHandler,
      openPopupIds,
      playerAnimationControls,
      setOpenPopupIds,
      shouldShowPlayerOverlay,
      stopPropagAndResetTimeout,
      toggleChat
    },
    ref
  ) => {
    const { channelData: { isViewerBanned } = {} } = useChannel();
    const { selectedQualityName } = livePlayer;

    // This function prevents click events to be triggered on the controls while the controls are hidden
    const onClickCaptureControlsHandler = useCallback(
      (event) => {
        event.stopPropagation();
        onClickPlayerHandler(event);
      },
      [onClickPlayerHandler]
    );

    return (
      // The onClick is only used on touchscreen, where the keyboard isn't available
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events
      <div
        className={clsm([
          'items-center',
          'justify-center',
          'h-full',
          'w-full',
          'portrait:md:max-h-[calc(calc(var(--mobile-vh,1vh)_*_100)_-_112px)]',
          isVisible ? 'flex' : 'hidden'
        ])}
        onClick={onClickPlayerHandler}
        role="toolbar"
      >
        <motion.video
          animate={playerAnimationControls}
          className={clsm(
            'absolute',
            'transition-colors',
            'duration-[400ms]',
            'w-full',
            'h-full',
            isProfileExpanded
              ? ['bg-darkMode-gray-light', 'dark:bg-darkMode-gray-medium']
              : 'bg-transparent',
            isLoading || isViewerBanned ? '!hidden' : 'block'
          )}
          muted
          playsInline
          ref={ref}
        />
        <PlayerOverlay
          isVisible={shouldShowPlayerOverlay && !isProfileExpanded}
        >
          <Controls
            handleControlsVisibility={handleControlsVisibility}
            isChatVisible={isChatVisible}
            isFullscreenEnabled={isFullscreenEnabled}
            isViewerBanned={isViewerBanned}
            onClickFullscreenHandler={onClickFullscreenHandler}
            openPopupIds={openPopupIds}
            player={livePlayer}
            selectedQualityName={selectedQualityName}
            setOpenPopupIds={setOpenPopupIds}
            stopPropagAndResetTimeout={stopPropagAndResetTimeout}
            toggleChat={toggleChat}
          />
        </PlayerOverlay>
        {!isControlsOpen && (
          <div
            className={clsm(['absolute', 'h-full', 'top-0', 'w-full'])}
            onClickCapture={onClickCaptureControlsHandler}
          />
        )}
      </div>
    );
  }
);

StreamVideo.propTypes = {
  handleControlsVisibility: PropTypes.func.isRequired,
  isChatVisible: PropTypes.bool,
  isControlsOpen: PropTypes.bool,
  isFullscreenEnabled: PropTypes.bool,
  isProfileExpanded: PropTypes.bool,
  isLoading: PropTypes.bool,
  isVisible: PropTypes.bool,
  livePlayer: PropTypes.object.isRequired,
  onClickFullscreenHandler: PropTypes.func.isRequired,
  onClickPlayerHandler: PropTypes.func.isRequired,
  openPopupIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  playerAnimationControls: PropTypes.object.isRequired,
  setOpenPopupIds: PropTypes.func.isRequired,
  shouldShowPlayerOverlay: PropTypes.bool,
  stopPropagAndResetTimeout: PropTypes.func.isRequired,
  toggleChat: PropTypes.func.isRequired
};

StreamVideo.defaultProps = {
  isChatVisible: true,
  isControlsOpen: false,
  isFullscreenEnabled: false,
  isProfileExpanded: false,
  isLoading: false,
  isVisible: false,
  shouldShowPlayerOverlay: false
};

export default StreamVideo;
