import { forwardRef, useEffect } from 'react';
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
      isFullscreenEnabled,
      isPlayerLoading,
      isVisible,
      onClickFullscreenHandler,
      onClickPlayerHandler,
      openPopupIds,
      playerProfileViewAnimationProps,
      setOpenPopupIds
    },
    ref
  ) => {
    const {
      isProfileViewExpanded,
      runningAnimationIds,
      shouldAnimateProfileView
    } = useProfileViewAnimation();
    const {
      isOverlayVisible,
      onMouseMoveHandler,
      openOverlayAndResetTimeout,
      player: { selectedQualityName }
    } = usePlayerContext();
    const { channelData: { isViewerBanned } = {} } = useChannel();
    const { isDefaultResponsiveView } = useResponsiveDevice();
    const isPlayerAnimationRunning = runningAnimationIds.includes('player');
    const shouldShowControlsOverlay =
      isOverlayVisible && !isPlayerAnimationRunning && !isViewerBanned;
    const areControlsContained = !!(
      isProfileViewExpanded ^ isPlayerAnimationRunning
    );

    // This function prevents click events to be triggered on the controls while the controls are hidden
    const onClickCaptureControlsHandler = (event) => {
      event.stopPropagation();
      onClickPlayerHandler(event);
    };

    // Open the controls and reset the timeout when the player animation stops
    useEffect(() => {
      if (!isPlayerAnimationRunning) openOverlayAndResetTimeout();
    }, [isPlayerAnimationRunning, openOverlayAndResetTimeout]);

    return (
      <>
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
              isDefaultResponsiveView ? 'w-[90%]' : 'w-[70%]',
              'h-auto'
            ], // ensures StreamVideo has the correct dimensions when it mounts in the expanded profile view state
            (isPlayerLoading || isViewerBanned) && '!hidden'
          )}
          muted
          playsInline
          ref={ref}
        />
        <motion.div
          {...playerProfileViewAnimationProps}
          className={clsm([
            'absolute',
            isProfileViewExpanded && '-z-10', // makes sure that the player header is stacked above the player controls
            !areControlsContained && ['!aspect-auto', '!w-full', '!h-full'],
            !isVisible && '!hidden'
          ])}
          onClick={onClickPlayerHandler}
          onMouseMove={onMouseMoveHandler}
          role="toolbar"
        >
          <PlayerOverlay isVisible={shouldShowControlsOverlay}>
            <Controls
              areControlsContained={areControlsContained}
              isFullscreenEnabled={isFullscreenEnabled}
              onClickFullscreenHandler={onClickFullscreenHandler}
              openPopupIds={openPopupIds}
              selectedQualityName={selectedQualityName}
              setOpenPopupIds={setOpenPopupIds}
            />
          </PlayerOverlay>
          {!shouldShowControlsOverlay && (
            <div
              className={clsm(['absolute', 'h-full', 'top-0', 'w-full'])}
              onClickCapture={onClickCaptureControlsHandler}
            />
          )}
        </motion.div>
      </>
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
