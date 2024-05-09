import { useRef } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import StageVideo from './StageVideo';

import './StageVideoGrid.css';
import { useBroadcastFullScreen } from '../../../../../contexts/BroadcastFullscreen';
import { clsm } from '../../../../../utils';
import { PARTICIPANT_TYPE_SCREENSHARE } from '../../../../../constants';
import { useGlobalStage } from '../../../../../contexts/Stage';
import { useLocation } from 'react-router-dom';
import InviteParticipant from './InviteParticipant';
import ParticipantOverflowCard from './ParticipantOverflowCard';
import ScreenshareVideo from './ScreenshareVideo';
import useCalculatedAspectRatio from '../FullScreenView/useCalculatedAspectRatio';
import useScreenshareRow from '../../../hooks/useScreenshareRow';

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
  const { pathname } = useLocation();
  const stageVideoFeedsRef = useRef();
  const { parentRef: containerRef } = useCalculatedAspectRatio({
    childRef: stageVideoFeedsRef,
    isAnimated: false
  });

  const participantList = Array.from(participants).slice(0, 12);
  const videoAudioParticipants = participantList.filter(
    (participant) =>
      participant[1]?.attributes?.type !== PARTICIPANT_TYPE_SCREENSHARE
  );
  const videoAudioParticipantsLength = videoAudioParticipants.length;
  const isChannelType = type === STAGE_VIDEO_FEEDS_TYPES.CHANNEL;
  const containerMinHeightPX = isFullScreenViewOpen || isChannelType ? 200 : 0;
  const isInviteParticipantCardVisible =
    pathname === '/manager' &&
    !isChannelType &&
    !isRequestedUserType &&
    videoAudioParticipantsLength <= 1;

  let gridItemCountClasses;
  if (videoAudioParticipantsLength > 2 || isChannelType) {
    gridItemCountClasses = `grid-${videoAudioParticipantsLength}`;
  } else if (isRequestedUserType && videoAudioParticipantsLength === 1) {
    gridItemCountClasses = ['grid-rows-1', 'grid-cols-1'];
  } else {
    gridItemCountClasses = ['grid-rows-1', 'grid-cols-2'];
  }

  const {
    hiddenOverflowAvatarsLength,
    isOverflowCardVisible,
    isScreenshareVisible,
    maxColumnCount,
    screenshareParticipantColCount,
    screenshareParticipants,
    visibleOverflowAvatars
  } = useScreenshareRow({
    participantList,
    containerRef: stageVideoFeedsRef,
    videoAudioParticipants,
    containerMinHeightPX
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
        styles
      ])}
      ref={containerRef}
      style={{
        minHeight: `${containerMinHeightPX}px`
      }}
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
          isScreenshareVisible && [
            'grid',
            'gap-4',
            'grid-rows-[calc(80%-16px)_1fr]'
          ],
          dimensionClasses
        ])}
      >
        {isScreenshareVisible && (
          <div className={clsm(['flex', 'flex-wrap', 'gap-4'])}>
            {screenshareParticipants.map(([userId, _]) => (
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
            isScreenshareVisible
              ? ['justify-center', 'flex', 'mx-auto']
              : ['w-full', 'grid', gridItemCountClasses]
          ])}
          style={{
            ...(isScreenshareVisible && {
              width: `calc(((10% * ${screenshareParticipantColCount}) - 16px) * 16 / 9)`
            })
          }}
        >
          {!isJoiningStageByRequestOrInvite &&
            videoAudioParticipants.map(([userId, _], index) => {
              const isHidden =
                isOverflowCardVisible && maxColumnCount <= index + 1;

              return (
                <StageVideo
                  key={`stage-video-${userId}`}
                  participantKey={userId}
                  type={type}
                  className={clsm(
                    isScreenshareVisible
                      ? ['flex-1', isHidden && 'hidden']
                      : [
                          videoAudioParticipantsLength > 2 &&
                            `slot-${index + 1}`
                        ]
                  )}
                />
              );
            })}
          {isOverflowCardVisible && (
            <ParticipantOverflowCard
              avatars={visibleOverflowAvatars}
              additionalCount={hiddenOverflowAvatarsLength}
              isMinified={!isFullScreenViewOpen}
            />
          )}
          {isInviteParticipantCardVisible && (
            <InviteParticipant
              type={type}
              className={isScreenshareVisible ? 'flex-1' : ''}
              hideText={isScreenshareVisible}
            />
          )}
          {isJoiningStageByRequestOrInvite && (
            <div
              className={clsm([
                '@container/invite-participant-container',
                'dark:bg-darkMode-gray-medium',
                'bg-lightMode-gray-light',
                'flex',
                'justify-center',
                'items-center',
                'rounded-xl',
                'flex-1'
              ])}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
};

StageVideoFeeds.propTypes = {
  styles: PropTypes.string,
  type: PropTypes.oneOf(Object.values(STAGE_VIDEO_FEEDS_TYPES)).isRequired
};

export default StageVideoFeeds;
