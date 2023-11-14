import { useRef } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import StageVideo from './StageVideo';

import { clsm } from '../../../../../utils';
import { useBroadcastFullScreen } from '../../../../../contexts/BroadcastFullscreen';
import InviteParticipant from './InviteParticipant';
import './StageVideoGrid.css';
import useCalculatedAspectRatio from '../FullScreenView/useCalculatedAspectRatio';
import { useGlobalStage } from '../../../../../contexts/Stage';
import { useResponsiveDevice } from '../../../../../contexts/ResponsiveDevice';

// These types in STAGE_VIDEO_FEEDS_TYPES correspond to different rendering locations for the component.
export const STAGE_VIDEO_FEEDS_TYPES = {
  GO_LIVE: 'golive',
  FULL_SCREEN: 'fullscreen',
  CHANNEL: 'channel'
};

const StageVideoFeeds = ({ styles, type }) => {
  const { isDesktopView } = useResponsiveDevice();
  const { participants } = useGlobalStage();
  const {
    isFullScreenViewOpen,
    fullscreenAnimationControls,
    dimensionClasses
  } = useBroadcastFullScreen();
  const participantList = Array.from(participants).slice(0, 12);
  const participantSize = participantList.length;
  const stageVideoFeedsRef = useRef();
  const { parentRef: containerRef } = useCalculatedAspectRatio({
    childRef: stageVideoFeedsRef
  });
  const isChannelType = type === STAGE_VIDEO_FEEDS_TYPES.CHANNEL;

  const getGridItemCountClasses = () => {
    if (isFullScreenViewOpen && !isDesktopView && participantSize <= 2) {
      return ['grid-cols-1', 'grid-rows-2'];
    }

    if (participantSize > 2 || isChannelType) return `grid-${participantSize}`;

    return ['grid-rows-1', 'grid-cols-2'];
  };

  return (
    <div
      className={clsm([
        'bg-white',
        'dark:bg-black',
        'flex',
        'h-full',
        'justify-center',
        'overflow-hidden',
        'relative',
        'rounded-xl',
        'w-full',
        (isFullScreenViewOpen || isChannelType) && 'min-h-[200px]',
        styles
      ])}
      ref={containerRef}
    >
      <motion.div
        animate={fullscreenAnimationControls}
        ref={stageVideoFeedsRef}
        className={clsm([
          '-translate-y-1/2',
          '@container/video-container',
          'absolute',
          'grid',
          'h-full',
          'overflow-hidden',
          'top-1/2',
          'w-full',
          isFullScreenViewOpen || isChannelType ? 'gap-4' : 'gap-1',
          getGridItemCountClasses(),
          dimensionClasses
        ])}
      >
        {participantList.map(([userId, _], index) => (
          <StageVideo
            key={`stage-video-${userId}`}
            participantKey={userId}
            type={type}
            className={clsm([participantSize > 2 && `slot-${index + 1}`])}
          />
        ))}
        {!isChannelType && participantSize <= 1 && (
          <InviteParticipant type={type} />
        )}
      </motion.div>
    </div>
  );
};

StageVideoFeeds.defaultProps = {
  styles: ''
};

StageVideoFeeds.propTypes = {
  styles: PropTypes.string,
  type: PropTypes.oneOf(Object.values(STAGE_VIDEO_FEEDS_TYPES)).isRequired
};

export default StageVideoFeeds;
