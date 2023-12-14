import { useRef } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import StageVideo from './StageVideo';

import './StageVideoGrid.css';
import { clsm } from '../../../../../utils';
import { useBroadcastFullScreen } from '../../../../../contexts/BroadcastFullscreen';
import { useGlobalStage } from '../../../../../contexts/Stage';
import InviteParticipant from './InviteParticipant';
import ScreenshareVideo from './ScreenshareVideo';
import useCalculatedAspectRatio from '../FullScreenView/useCalculatedAspectRatio';
import ParticipantOverflowCard from './ParticipantOverflowCard';
import useScreenshareColumns from '../../../hooks/useScreenshareColumns';
import { PARTICIPANT_TYPE_SCREENSHARE } from '../../../../../constants';

// These types in STAGE_VIDEO_FEEDS_TYPES correspond to different rendering locations for the component.
export const STAGE_VIDEO_FEEDS_TYPES = {
  GO_LIVE: 'golive',
  FULL_SCREEN: 'fullscreen',
  CHANNEL: 'channel'
};

const StageVideoFeeds = ({ styles, type }) => {
  const { participants, isJoiningStageByRequestOrInvite } = useGlobalStage();

  const {
    isFullScreenViewOpen,
    fullscreenAnimationControls,
    dimensionClasses
  } = useBroadcastFullScreen();

  const participantList = Array.from(participants).slice(0, 12);
  const pubSubParticipantList = participantList.filter(
    (participant) =>
      participant[1]?.attributes?.type !== PARTICIPANT_TYPE_SCREENSHARE
  );
  const screenshareList = participantList.filter(
    (participant) =>
      participant[1]?.attributes?.type === PARTICIPANT_TYPE_SCREENSHARE
  );
  const participantSize = pubSubParticipantList.length;
  const stageVideoFeedsRef = useRef();
  const { parentRef: containerRef } = useCalculatedAspectRatio({
    childRef: stageVideoFeedsRef
  });
  const isChannelType = type === STAGE_VIDEO_FEEDS_TYPES.CHANNEL;
  const isScreenshareLayout = screenshareList.length > 0;

  let gridItemCountClasses =
    participantSize > 2
      ? `grid-${participantSize}`
      : ['grid-rows-1', 'grid-cols-2'];
  if (isChannelType) {
    gridItemCountClasses = `grid-${participantSize}`;
  }

  const {
    displayOverflowCard,
    visibleOverflowAvatars,
    additionalOverflowCount,
    screenshareParticipantColCount,
    maxColumnCount
  } = useScreenshareColumns({
    participantSize,
    isScreenshareLayout,
    containerRef: stageVideoFeedsRef,
    participantList: pubSubParticipantList
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
          'h-full',
          'overflow-hidden',
          'top-1/2',
          'w-full',
          isScreenshareLayout && [
            'grid',
            'gap-4',
            'grid-rows-[calc(80%-16px)_1fr]'
          ],
          dimensionClasses
        ])}
      >
        {isScreenshareLayout && (
          <div className={clsm(['flex', 'flex-wrap', 'gap-4'])}>
            {screenshareList.map(([userId, _]) => (
              <ScreenshareVideo
                key={`stage-screenshare-video-${userId}`}
                participantKey={userId}
                type={type}
              />
            ))}
          </div>
        )}
        <div
          className={clsm([
            'h-full',
            isFullScreenViewOpen || isChannelType ? 'gap-4' : 'gap-1',
            isScreenshareLayout
              ? ['justify-center', 'flex', 'mx-auto']
              : ['w-full', 'grid', gridItemCountClasses]
          ])}
          style={{
            ...(isScreenshareLayout && {
              width: `calc(((10% * ${screenshareParticipantColCount}) - 16px) * 16 / 9)`
            })
          }}
        >
          {!isJoiningStageByRequestOrInvite &&
            pubSubParticipantList.map(([userId, _], index) => {
              const isHidden =
                displayOverflowCard && maxColumnCount <= index + 1;

              return (
                <StageVideo
                  key={`stage-video-${userId}`}
                  participantKey={userId}
                  type={type}
                  className={clsm(
                    isScreenshareLayout
                      ? ['flex-1', isHidden && 'hidden']
                      : [participantSize > 2 && `slot-${index + 1}`]
                  )}
                />
              );
            })}
          {!isJoiningStageByRequestOrInvite &&
            isScreenshareLayout &&
            displayOverflowCard &&
            !!visibleOverflowAvatars.length && (
              <ParticipantOverflowCard
                avatars={visibleOverflowAvatars}
                additionalCount={additionalOverflowCount}
                isMinified={!isFullScreenViewOpen}
              />
            )}

          {isJoiningStageByRequestOrInvite && (
            <InviteParticipant
              type={type}
              className={isScreenshareLayout ? 'flex-1' : ''}
              hideText={isScreenshareLayout}
            />
          )}
          {!isChannelType && participantSize <= 1 && (
            <InviteParticipant
              type={type}
              className={isScreenshareLayout ? 'flex-1' : ''}
              hideText={isScreenshareLayout}
            />
          )}
        </div>
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
