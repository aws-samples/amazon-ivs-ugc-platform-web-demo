import { AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
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
import VoteItem from './VoteItem';
import usePrompt from '../../../../hooks/usePrompt';
import PollContainer from './PollContainer';

const $content =
  $streamManagerContent.stream_manager_actions[STREAM_ACTION_NAME.POLL];

const StreamerPoll = ({
  highestCountOption,
  isActive,
  showFinalResults,
  totalVotes,
  votes,
  isExpanded
}) => {
  const pollRef = useRef(null);
  const { setIsExpanded, setPollRef, question } = usePoll();

  useEffect(() => {
    if (pollRef?.current) {
      setPollRef(pollRef.current);
    }
  }, [isExpanded, pollRef, setPollRef]);

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
    <PollContainer>
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
        onClick={() => setIsExpanded(!isExpanded)}
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

      {isExpanded && (
        <div
          className={clsm([
            'mt-[15px]',
            `bg-profile-${color}`,
            'flex-col',
            'flex',
            'items-start',
            'rounded-b-xl',
            'w-full'
          ])}
        >
          <p
            className={clsm([
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
            <AnimatePresence>
              {votes.map(({ option, count }, i) => {
                const isHighestCount = option === highestCountOption;
                const percentage =
                  (!!count && Math.ceil((count / totalVotes) * 100)) || 0;

                return (
                  <VoteItem
                    key={option}
                    isHighestCount={isHighestCount}
                    showFinalResults={showFinalResults}
                    option={option}
                    count={count}
                    percentage={percentage}
                    showVotePercentage={showVotePercentage}
                    color={color}
                    textColor={textColor}
                  />
                );
              })}
            </AnimatePresence>
          </div>
          <p
            className={clsm(['text-p4', `text-${textColor}`, 'font-bold'])}
          >{`${$content.total_votes}: ${totalVotes.toLocaleString()}`}</p>
        </div>
      )}
    </PollContainer>
  );
};

StreamerPoll.defaultProps = {
  isActive: false,
  showFinalResults: false,
  votes: [],
  totalVotes: 0
};

StreamerPoll.propTypes = {
  isActive: PropTypes.bool,
  votes: PropTypes.arrayOf(
    PropTypes.shape({
      option: PropTypes.string.isRequired,
      count: PropTypes.number
    })
  ),
  showFinalResults: PropTypes.bool,
  totalVotes: PropTypes.number,
  highestCountOption: PropTypes.string.isRequired,
  isExpanded: PropTypes.bool.isRequired
};

export default StreamerPoll;
