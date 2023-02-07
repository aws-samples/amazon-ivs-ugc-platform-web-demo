import { forwardRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

import { clsm } from '../../../utils';
import { useChannel } from '../../../contexts/Channel';
import { usePlayerContext } from '../contexts/Player';
import { useProfileViewAnimation } from '../contexts/ProfileViewAnimation';
import { useResponsiveDevice } from '../../../contexts/ResponsiveDevice';
import Controls from './Controls';
import PlayerOverlay from './PlayerOverlay';

const StreamVideo = forwardRef(
  (
    {
      playerProfileViewAnimationProps,
      isFullscreenEnabled,
      isPlayerLoading,
      isVisible,
      onClickFullscreenHandler,
      onClickPlayerHandler,
      openPopupIds,
      setOpenPopupIds
    },
    ref
  ) => {
    const { channelData: { isViewerBanned } = {} } = useChannel();
    const { isProfileViewExpanded, shouldAnimateProfileView } =
      useProfileViewAnimation();
    const { isOverlayVisible, player } = usePlayerContext();
    const { selectedQualityName } = player;
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
            isPlayerLoading || isViewerBanned ? '!hidden' : 'block'
          )}
          muted
          playsInline
          ref={ref}
        />
        <PlayerOverlay isVisible={isOverlayVisible && !isProfileViewExpanded}>
          <Controls
            isFullscreenEnabled={isFullscreenEnabled}
            onClickFullscreenHandler={onClickFullscreenHandler}
            openPopupIds={openPopupIds}
            selectedQualityName={selectedQualityName}
            setOpenPopupIds={setOpenPopupIds}
          />
        </PlayerOverlay>
        {(!isOverlayVisible || isProfileViewExpanded) && (
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
  isFullscreenEnabled: PropTypes.bool,
  isPlayerLoading: PropTypes.bool,
  isVisible: PropTypes.bool,
  onClickFullscreenHandler: PropTypes.func.isRequired,
  onClickPlayerHandler: PropTypes.func.isRequired,
  openPopupIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  playerProfileViewAnimationProps: PropTypes.object.isRequired,
  setOpenPopupIds: PropTypes.func.isRequired
};

StreamVideo.defaultProps = {
  isFullscreenEnabled: false,
  isPlayerLoading: false,
  isVisible: false
};

export default StreamVideo;
