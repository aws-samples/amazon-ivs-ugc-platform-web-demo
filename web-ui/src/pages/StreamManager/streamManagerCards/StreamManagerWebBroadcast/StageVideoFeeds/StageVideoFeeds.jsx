import { useRef } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

import { useStage } from '../../../../../contexts/Stage/Stage';
import StageVideo from './StageVideo';

import { clsm } from '../../../../../utils';
import { useBroadcastFullScreen } from '../../../../../contexts/BroadcastFullscreen';
import InviteParticipant from './InviteParticipant';
import './StageVideoGrid.css';
import useCalculatedAspectRatio from '../FullScreenView/useCalculatedAspectRatio';

// These types in STAGE_VIDEO_FEEDS_TYPES correspond to different rendering locations for the component.
export const STAGE_VIDEO_FEEDS_TYPES = {
  GO_LIVE: 'golive',
  FULL_SCREEN: 'fullscreen'
};

const StageVideoFeeds = ({ type }) => {
  const { participants } = useStage();
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
        isFullScreenViewOpen && 'min-h-[200px]'
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
          isFullScreenViewOpen ? 'gap-4' : 'gap-1',
          participantSize > 2
            ? `grid-${participantSize}`
            : ['grid-rows-1', 'grid-cols-2'],
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
        {participantSize <= 1 && <InviteParticipant type={type} />}
      </motion.div>
    </div>
  );
};

StageVideoFeeds.propTypes = {
  type: PropTypes.oneOf(Object.values(STAGE_VIDEO_FEEDS_TYPES)).isRequired
};

export default StageVideoFeeds;
