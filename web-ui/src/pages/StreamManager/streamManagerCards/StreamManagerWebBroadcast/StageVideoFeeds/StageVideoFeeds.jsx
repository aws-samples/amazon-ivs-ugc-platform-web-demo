import { motion, useAnimationControls } from 'framer-motion';
import { useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import StageVideo from './StageVideo';

import './StageVideoGrid.css';
import { clsm } from '../../../../../utils';
import { useLocation } from 'react-router-dom';
import { useStageManager } from '../../../../../contexts/StageManager';
import InviteParticipant from './InviteParticipant';
import ParticipantOverflowCard from './ParticipantOverflowCard';
import ScreenshareVideo from './ScreenshareVideo';
import useCalculatedAspectRatio from '../FullScreenView/useCalculatedAspectRatio';
import useScreenshareRow from '../../../hooks/useScreenshareRow';
import {
  COLLABORATE_ROUTE_PATH,
  FULLSCREEN_ANIMATION_DURATION,
  PARTICIPANT_TYPES
} from '../../../../../constants';
import Spinner from '../../../../../components/Spinner';
import { PARTICIPANT_GROUP } from '../../../../../contexts/StageManager/constants';

// These types in STAGE_VIDEO_FEEDS_TYPES correspond to different rendering locations for the component.
export const STAGE_VIDEO_FEEDS_TYPES = {
  GO_LIVE: 'golive',
  FULL_SCREEN: 'fullscreen',
  CHANNEL: 'channel'
};

const StageVideoFeeds = ({ styles = '', type }) => {
  const { collaborate } = useSelector((state) => state.shared);
  const { fullscreen } = useSelector((state) => state.streamManager);
  const {
    [PARTICIPANT_GROUP.USER]: userStage = null,
    [PARTICIPANT_GROUP.DISPLAY]: displayStage = null
  } = useStageManager() || {};
  const { pathname } = useLocation();

  // Aspect ratio
  const videoContainerRef = useRef();
  const videoContainerAnimationControls = useAnimationControls();
  const {
    parentRef: containerRef,
    controlAnimDefinition,
    setControlAnimDefinition
  } = useCalculatedAspectRatio({
    childRef: videoContainerRef,
    delay: FULLSCREEN_ANIMATION_DURATION * 1500 // Delay till the fullscreen expand transition ends
  });

  // Participants
  const isRequestedUserType =
    collaborate.participantType === PARTICIPANT_TYPES.REQUESTED;
  const publishingUserParticipants = userStage?.getParticipants({
    isPublishing: true,
    canSubscribeTo: true
  });
  const publishingDisplayParticipants = displayStage?.getParticipants({
    isPublishing: true,
    canSubscribeTo: true
  });
  const publishingUserParticipantsLength = publishingUserParticipants.length;

  // UI states
  const isChannelType = type === STAGE_VIDEO_FEEDS_TYPES.CHANNEL; // if true, the component is rendered on the channel page
  const containerMinHeightPX = fullscreen.isOpen || isChannelType ? 200 : 0;
  const isInviteParticipantCardVisible =
    pathname === COLLABORATE_ROUTE_PATH &&
    !isChannelType &&
    !isRequestedUserType &&
    type !== STAGE_VIDEO_FEEDS_TYPES.GO_LIVE &&
    publishingUserParticipantsLength <= 1;

  const gridItemCountClasses = useMemo(() => {
    if (publishingUserParticipantsLength > 2 || isChannelType) {
      return `grid-${publishingUserParticipantsLength}`;
    } else if (
      !isInviteParticipantCardVisible &&
      publishingUserParticipantsLength === 1
    ) {
      return ['grid-rows-1', 'grid-cols-1'];
    } else {
      return ['grid-rows-1', 'grid-cols-2'];
    }
  }, [
    isChannelType,
    isInviteParticipantCardVisible,
    publishingUserParticipantsLength
  ]);

  const {
    hiddenOverflowAvatarsLength,
    isOverflowCardVisible,
    isScreenshareVisible,
    maxColumnCount,
    visibleOverflowAvatars
  } = useScreenshareRow({
    publishingDisplayParticipants,
    videoContainerRef,
    videoAudioParticipants: publishingUserParticipants,
    containerMinHeightPX,
    parentContainerRef: containerRef
  });

  /**
   * Animates the video container based on the controlAnimDefinition value
   * Provided by useCalculateAspectRatio.
   * This makes sure the container has the correct video aspect ratio.
   */
  useEffect(() => {
    if (!videoContainerAnimationControls || !controlAnimDefinition) return;

    videoContainerAnimationControls.set(
      fullscreen.isOpen
        ? controlAnimDefinition
        : { width: '100%', height: '100%' }
    );

    setControlAnimDefinition(null);
  }, [
    controlAnimDefinition,
    setControlAnimDefinition,
    fullscreen.isOpen,
    videoContainerAnimationControls
  ]);

  if (fullscreen.isAnimating)
    return (
      <div
        className={clsm([
          'flex',
          'w-full',
          'h-full',
          'justify-center',
          'items-center'
        ])}
      >
        <Spinner variant="light" size="large" />
      </div>
    );

  return (
    <div
      className={clsm([
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
        animate={videoContainerAnimationControls}
        ref={videoContainerRef}
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
          ]
        ])}
      >
        {isScreenshareVisible && (
          <div className={clsm(['flex', 'flex-wrap', 'gap-4'])}>
            {publishingDisplayParticipants.map((participant) => (
              <ScreenshareVideo
                key={`stage-screenshare-video-${participant.userId}`}
                type={type}
                participant={participant}
              />
            ))}
          </div>
        )}
        <div
          className={clsm([
            'h-full',
            fullscreen.isOpen || isChannelType ? 'gap-4' : 'gap-1',
            isScreenshareVisible
              ? ['justify-center', 'flex', 'mx-auto']
              : ['w-full', 'grid', gridItemCountClasses]
          ])}
        >
          {!collaborate.isJoining &&
            publishingUserParticipants.map((participant, index) => {
              const isHidden =
                isOverflowCardVisible && maxColumnCount <= index + 1;

              return (
                <StageVideo
                  key={`stage-video-${participant.id}`}
                  participant={participant}
                  type={type}
                  className={clsm(
                    isScreenshareVisible
                      ? ['flex-1', isHidden && 'hidden']
                      : [
                          publishingUserParticipantsLength > 2 &&
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
              isMinified={!isChannelType && !fullscreen.isOpen}
            />
          )}
          {isInviteParticipantCardVisible && (
            <InviteParticipant
              type={type}
              className={isScreenshareVisible ? 'flex-1' : ''}
              hideText={isScreenshareVisible}
            />
          )}
          {collaborate.isJoining && (
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
