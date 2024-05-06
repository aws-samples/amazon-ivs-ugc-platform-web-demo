import { useRef } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import StageVideo from './StageVideo';

import { clsm } from '../../../../../utils';
import {
  ANIMATION_DURATION,
  useBroadcastFullScreen
} from '../../../../../contexts/BroadcastFullscreen';
import InviteParticipant from './InviteParticipant';
import './StageVideoGrid.css';
import useCalculatedAspectRatio from '../FullScreenView/useCalculatedAspectRatio';
import { useGlobalStage } from '../../../../../contexts/Stage';
import { useLocation } from 'react-router-dom';

// These types in STAGE_VIDEO_FEEDS_TYPES correspond to different rendering locations for the component.
export const STAGE_VIDEO_FEEDS_TYPES = {
  GO_LIVE: 'golive',
  FULL_SCREEN: 'fullscreen',
  CHANNEL: 'channel'
};

const StageVideoFeeds = ({ styles = '', type }) => {
  const { participants, isJoiningStageByRequestOrInvite, isRequestedUserType } =
    useGlobalStage();
  const {
    isFullScreenViewOpen,
    fullscreenAnimationControls,
    dimensionClasses
  } = useBroadcastFullScreen();

  const participantList = Array.from(participants).slice(0, 12);
  const participantSize = participantList.length;
  const stageVideoFeedsRef = useRef();
  const { parentRef: containerRef } = useCalculatedAspectRatio({
    childRef: stageVideoFeedsRef,
    delay: (ANIMATION_DURATION + 100) * 100
  });
  const { pathname } = useLocation();
  const isChannelType = type === STAGE_VIDEO_FEEDS_TYPES.CHANNEL;

  let gridItemCountClasses;
  if (participantSize > 2 || isChannelType) {
    gridItemCountClasses = `grid-${participantSize}`;
  } else if (isRequestedUserType && participantSize === 1) {
    gridItemCountClasses = ['grid-rows-1', 'grid-cols-1'];
  } else {
    gridItemCountClasses = ['grid-rows-1', 'grid-cols-2'];
  }

  const shouldRenderInviteParticipant =
    pathname === '/manager' &&
    !isChannelType &&
    participantSize <= 1 &&
    !isRequestedUserType;

  const shouldRenderEmptyInviteParticipantCard =
    shouldRenderInviteParticipant && isJoiningStageByRequestOrInvite;

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
          gridItemCountClasses,
          dimensionClasses
        ])}
      >
        {!isJoiningStageByRequestOrInvite &&
          participantList.map(([userId, _], index) => (
            <StageVideo
              key={`stage-video-${userId}`}
              participantKey={userId}
              type={type}
              className={clsm([participantSize > 2 && `slot-${index + 1}`])}
            />
          ))}
        {shouldRenderEmptyInviteParticipantCard && (
          <InviteParticipant type={type} />
        )}
        {shouldRenderInviteParticipant && <InviteParticipant type={type} />}
      </motion.div>
    </div>
  );
};

StageVideoFeeds.propTypes = {
  styles: PropTypes.string,
  type: PropTypes.oneOf(Object.values(STAGE_VIDEO_FEEDS_TYPES)).isRequired
};

export default StageVideoFeeds;
