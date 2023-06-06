import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import PropTypes from 'prop-types';

import { clsm } from '../../../../utils';
import {
  PROFILE_COLORS_WITH_WHITE_TEXT,
  STREAM_ACTION_NAME
} from '../../../../constants';
import { streamManager as $streamManagerContent } from '../../../../content';
import { useChannel } from '../../../../contexts/Channel';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import { usePoll } from '../../../../contexts/StreamManagerActions/Poll';
import Button from '../../../../components/Button/Button';
import ProgressBar from '../../ViewerStreamActions/ProgressBar';
import Spinner from '../../../../components/Spinner';
import VoteItem from './VoteItem';

const $content =
  $streamManagerContent.stream_manager_actions[STREAM_ACTION_NAME.POLL];

const ViewerPoll = ({
  question,
  votes,
  showFinalResults,
  totalVotes,
  highestCountOption
}) => {
  const [selectedOption, setSelectedOption] = useState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVoting, setIsVoting] = useState(true);
  const { isTouchscreenDevice } = useResponsiveDevice();
  const { channelData } = useChannel();
  const { color } = channelData || {};

  const inputDivControls = useAnimationControls();
  const buttonDivControls = useAnimationControls();
  const radioBoxControls = useAnimationControls();
  const { duration } = usePoll();

  const textColor = PROFILE_COLORS_WITH_WHITE_TEXT.includes(color)
    ? 'white'
    : 'black';

  const onOptionChange = (option) => {
    setSelectedOption(option);
  };

  const submitVote = useCallback(() => {
    setIsSubmitting(true);
    setTimeout(async () => {
      await radioBoxControls.start({
        left: '-300px',
        opacity: 0,
        transition: { duration: 0.1 }
      });

      await Promise.all([
        inputDivControls.start({
          x: '-1px',
          transition: { duration: 0.2 }
        }),
        buttonDivControls.start({
          height: 0,
          padding: 0,
          transition: { duration: 0.2 }
        })
      ]);
      setIsVoting(false);
      setIsSubmitting(false);
    }, 2000);
  }, [buttonDivControls, inputDivControls, radioBoxControls]);

  const progressBarMemo = useMemo(
    () => (
      <ProgressBar color={color} duration={duration} startTime={Date.now()} />
    ),
    [color, duration]
  );

  return (
    <div
      className={clsm([
        'm-5',
        'mb-0',
        'p-5',
        showFinalResults && 'pb-7',
        `bg-profile-${color}`,
        'rounded-xl'
      ])}
    >
      <h3
        className={clsm([
          'flex',
          'pb-5',
          'w-full',
          'justify-center',
          'break-word',
          'text-center',
          `text-${textColor}`
        ])}
      >
        {question}
      </h3>
      <div className={clsm(['flex-col', 'flex', 'space-y-2', 'w-full'])}>
        <AnimatePresence>
          {votes.map(({ option, count, id }, index) => {
            const isHighestCount = option === highestCountOption;
            const percentage = Math.ceil((count / totalVotes) * 100);

            return (
              <VoteItem
                key={id}
                isHighestCount={isHighestCount}
                showFinalResults={showFinalResults}
                option={option}
                count={count}
                percentage={percentage}
                showVotePercentage={true}
                selectedOption={selectedOption}
                color={color}
                textColor={textColor}
                onChange={onOptionChange}
                inputDivControls={inputDivControls}
                radioBoxControls={radioBoxControls}
                inputAndLabelId={`${option}-${index}`}
                isVoting={isVoting}
              />
            );
          })}
        </AnimatePresence>
      </div>
      {!showFinalResults && (
        <motion.div
          animate={buttonDivControls}
          className={clsm(['w-full', 'pt-4', 'overflow-hidden'])}
        >
          <Button
            isDisabled={!selectedOption}
            ariaLabel={$content.vote}
            className={clsm([
              'w-full',
              `bg-poll-${color}-pollButtonBg`,
              `focus:bg-profile-${color}-darkMode-primary`,
              isTouchscreenDevice && [`focus:bg-poll-${color}-pollButtonBg`],
              !isTouchscreenDevice && [
                `hover:bg-profile-${color}-darkMode-primary-hover`
              ],
              `text-${textColor}`
            ])}
            onClick={submitVote}
          >
            {!isSubmitting ? $content.vote : <Spinner variant="light" />}
          </Button>
        </motion.div>
      )}
      {!showFinalResults && <div className={'pt-5'}>{progressBarMemo}</div>}
    </div>
  );
};

ViewerPoll.defaultProps = {
  totalVotes: 0
};

ViewerPoll.propTypes = {
  question: PropTypes.string.isRequired,
  // duration: PropTypes.number.isRequired,
  votes: PropTypes.arrayOf(
    PropTypes.shape({
      option: PropTypes.string.isRequired,
      count: PropTypes.number
    })
  ).isRequired,
  showFinalResults: PropTypes.bool.isRequired,
  highestCountOption: PropTypes.string.isRequired,
  totalVotes: PropTypes.number
};

export default ViewerPoll;
