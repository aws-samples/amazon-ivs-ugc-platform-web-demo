import { forwardRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

import { clsm } from '../../../utils';
import { useChannel } from '../../../contexts/Channel';
import { useProfileViewAnimation } from '../contexts/ProfileViewAnimation';
import { useResponsiveDevice } from '../../../contexts/ResponsiveDevice';
import Controls from './Controls';
import PlayerOverlay from './PlayerOverlay';

const StreamVideo = forwardRef(
  (
    {
      playerProfileViewAnimationProps,
      handleControlsVisibility,
      isControlsOpen,
      isFullscreenEnabled,
      isLoading,
      isVisible,
      livePlayer,
      onClickFullscreenHandler,
      onClickPlayerHandler,
      openPopupIds,
      setOpenPopupIds,
      shouldShowPlayerOverlay,
      stopPropagAndResetTimeout
    },
    ref
  ) => {
    const { channelData: { isViewerBanned } = {} } = useChannel();
    const { isProfileViewExpanded, shouldAnimateProfileView } =
      useProfileViewAnimation();
    const { selectedQualityName } = livePlayer;
    const { isMobileView } = useResponsiveDevice();

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
          {...playerProfileViewAnimationProps}
          className={clsm(
            'absolute',
            'w-full',
            'aspect-auto',
            'transition-colors',
            '-z-10',
            shouldAnimateProfileView.current
              ? 'duration-[400ms]'
              : 'duration-0',
            isProfileViewExpanded
              ? ['bg-lightMode-gray-light', 'dark:bg-darkMode-gray-medium']
              : 'bg-transparent',
            isProfileViewExpanded && [
              isMobileView ? 'w-[80%]' : 'w-[70%]',
              'h-auto'
            ], // ensures StreamVideo has the correct dimensions when it mounts in the expanded profile view state
            isLoading || isViewerBanned ? '!hidden' : 'block'
          )}
          muted
          playsInline
          ref={ref}
        />
        <PlayerOverlay
          isVisible={shouldShowPlayerOverlay && !isProfileViewExpanded}
        >
          <Controls
            handleControlsVisibility={handleControlsVisibility}
            isFullscreenEnabled={isFullscreenEnabled}
            isViewerBanned={isViewerBanned}
            onClickFullscreenHandler={onClickFullscreenHandler}
            openPopupIds={openPopupIds}
            player={livePlayer}
            selectedQualityName={selectedQualityName}
            setOpenPopupIds={setOpenPopupIds}
            stopPropagAndResetTimeout={stopPropagAndResetTimeout}
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
  isControlsOpen: PropTypes.bool,
  isFullscreenEnabled: PropTypes.bool,
  isLoading: PropTypes.bool,
  isVisible: PropTypes.bool,
  livePlayer: PropTypes.object.isRequired,
  onClickFullscreenHandler: PropTypes.func.isRequired,
  onClickPlayerHandler: PropTypes.func.isRequired,
  openPopupIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  playerProfileViewAnimationProps: PropTypes.object.isRequired,
  setOpenPopupIds: PropTypes.func.isRequired,
  shouldShowPlayerOverlay: PropTypes.bool,
  stopPropagAndResetTimeout: PropTypes.func.isRequired
};

StreamVideo.defaultProps = {
  isControlsOpen: false,
  isFullscreenEnabled: false,
  isLoading: false,
  isVisible: false,
  shouldShowPlayerOverlay: false
};

export default StreamVideo;
