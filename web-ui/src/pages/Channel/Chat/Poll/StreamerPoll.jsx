import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsm } from '../../../../utils';

import { ChevronDown, ChevronUp } from '../../../../assets/icons';
import {
  STREAM_ACTION_NAME,
  BREAKPOINTS,
  PROFILE_COLORS_WITH_WHITE_TEXT
} from '../../../../constants';
import { streamManager as $streamManagerContent } from '../../../../content';
import { useChannel } from '../../../../contexts/Channel';
import { useModal } from '../../../../contexts/Modal';
import { usePoll } from '../../../../contexts/StreamManagerActions/Poll';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import Button from '../../../../components/Button';
import usePrompt from '../../../../hooks/usePrompt';
import PollContainer from './PollContainer';
import AnimatedVoteItems from './AnimatedVoteItems';
import {
  createAnimationProps,
  getDefaultBounceTransition
} from '../../../../helpers/animationPropsHelper';

const $content =
  $streamManagerContent.stream_manager_actions[STREAM_ACTION_NAME.POLL];

const StreamerPoll = () => {
  const pollRef = useRef(null);
  const { isActive, question, dispatchPollState, isExpanded, totalVotes } =
    usePoll();

  useEffect(() => {
    if (pollRef?.current) {
      dispatchPollState({ pollRef: pollRef.current });
    }
  }, [dispatchPollState, isExpanded, pollRef]);

  const { channelData } = useChannel();
  const { color } = channelData || {};
  const textColor = PROFILE_COLORS_WITH_WHITE_TEXT.includes(color)
    ? 'white'
    : 'black';

  const { currentBreakpoint } = useResponsiveDevice();
  const { openModal } = useModal();
  const showVotePercentage = currentBreakpoint <= BREAKPOINTS.xs ? true : false;

  const { isBlocked, onCancel, onConfirm } = usePrompt(isActive);

  useEffect(() => {
    if (isBlocked && isActive) {
      openModal({
        content: {
          confirmText: $content.leave_page,
          isDestructive: true,
          message: <p>{$content.confirm_leave_page}</p>
        },
        onConfirm,
        onCancel
      });
    }
  }, [isBlocked, onCancel, onConfirm, openModal, isActive]);

  return (
    <PollContainer ref={pollRef}>
      <Button
        variant="primaryText"
        className={clsm([
          `dark:hover:bg-poll-${color}-pollVoteBg`,
          `hover:bg-poll-${color}-pollVoteBg`,
          `bg-profile-${color}`,
          `dark:text-${textColor}`,
          `text-${textColor}`,
          'h-full',
          `focus:bg-profile-${color}`,
          'focus:rounded-xxl',
          'p-1',
          'pr-3',
          'rounded-2xl'
        ])}
        onClick={() => dispatchPollState({ isExpanded: !isExpanded })}
      >
        {isExpanded ? (
          <ChevronUp
            className={clsm(['w-6', 'h-6', 'mr-2', `!fill-${textColor}`])}
          />
        ) : (
          <ChevronDown
            className={clsm(['w-6', 'h-6', 'mr-2', `!fill-${textColor}`])}
          />
        )}
        {$content.poll_results}
      </Button>
      <AnimatePresence initial={false}>
        <motion.div
          key="StreamerPollContainer"
          {...createAnimationProps({
            animations: ['fadeIn-full'],
            transition: 'bounce',
            customVariants: {
              hidden: {
                height: 0,
                transitionEnd: { display: 'none' }
              },
              visible: {
                height: 'auto',
                transition: {
                  ...getDefaultBounceTransition(isExpanded),
                  opacity: { delay: 0.25 }
                }
              }
            },
            options: {
              isVisible: isExpanded
            }
          })}
          className={clsm([
            `bg-profile-${color}`,
            'flex-col',
            'flex',
            'items-start',
            'rounded-b-xl',
            'w-full',
            'overflow-hidden'
          ])}
        >
          <p
            className={clsm([
              'break-words',
              'mt-[15px]',
              'text-center',
              'mb-3',
              'text-p4',
              'w-full',
              `text-${textColor}`,
              'font-bold'
            ])}
          >
            {question}
          </p>
          <div
            className={clsm([
              'flex-col',
              'flex',
              'w-full',
              'space-y-2',
              'pb-5'
            ])}
          >
            <AnimatedVoteItems
              showVotePercentage={showVotePercentage}
              textColor={textColor}
            />
          </div>
          <p
            className={clsm(['text-p4', `text-${textColor}`, 'font-bold'])}
          >{`${$content.total_votes}: ${totalVotes.toLocaleString()}`}</p>
        </motion.div>
      </AnimatePresence>
    </PollContainer>
  );
};

export default StreamerPoll;
