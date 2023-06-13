import { useCallback } from 'react';
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
import PollContainer from './PollContainer';

const $content =
  $streamManagerContent.stream_manager_actions[STREAM_ACTION_NAME.POLL];

const ViewerPoll = ({
  question,
  votes,
  showFinalResults,
  totalVotes,
  highestCountOption,
  duration,
  startTime,
  isVoting,
  isSubmitting,
  selectedOption
}) => {
  const { isTouchscreenDevice } = useResponsiveDevice();
  const { setIsSubmitting, setIsVoting } = usePoll();
  const { channelData } = useChannel();
  const { color } = channelData || {};

  const inputDivControls = useAnimationControls();
  const buttonDivControls = useAnimationControls();
  const radioBoxControls = useAnimationControls();

  const textColor = PROFILE_COLORS_WITH_WHITE_TEXT.includes(color)
    ? 'white'
    : 'black';

  const submitVote = useCallback(() => {
    setIsSubmitting(true);
    setTimeout(async () => {
      await radioBoxControls.start({
        left: '-300px',
        opacity: 0,
        transition: { duration: 0.1 }
      });

      await Promise.all([
        buttonDivControls.start({
          height: 0,
          padding: 0,
          opacity: 0,
          transition: { duration: 0.1 }
        }),
        inputDivControls.start({
          x: '-1px',
          transition: { duration: 0.2 }
        })
      ]);
      setIsVoting(false);
      setIsSubmitting(false);
    }, 2000);
  }, [
    buttonDivControls,
    inputDivControls,
    radioBoxControls,
    setIsSubmitting,
    setIsVoting
  ]);

  // const progressBarMemo = useMemo(
  //   () => (

  //   ),
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  //   [duration]
  // );

  return (
    <PollContainer>
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
            const percentage =
              (!!count && Math.ceil((count / totalVotes) * 100)) || 0;

            return (
              <VoteItem
                key={id}
                isHighestCount={isHighestCount}
                option={option}
                count={count}
                percentage={percentage}
                showVotePercentage={true}
                color={color}
                textColor={textColor}
                inputDivControls={inputDivControls}
                radioBoxControls={radioBoxControls}
                inputAndLabelId={`${option}-${index}`}
              />
            );
          })}
        </AnimatePresence>
      </div>
      {!showFinalResults && isVoting && (
        <motion.div
          animate={buttonDivControls}
          className={clsm(['w-full', 'pt-4', 'overflow-hidden'])}
        >
          <Button
            isDisabled={!selectedOption}
            disableHover={isTouchscreenDevice}
            ariaLabel={$content.vote}
            className={clsm([
              'w-full',
              `bg-poll-${color}-pollButtonBg`,
              `focus:bg-poll-${color}-pollButtonBg`,
              `dark:focus:bg-poll-${color}-pollButtonBg`,
              !isTouchscreenDevice
                ? `hover:bg-poll-${color}-voteButtonHover`
                : `hover:bg-poll-${color}-voteButtpollButtonBg`,
              `text-${textColor}`
            ])}
            onClick={submitVote}
          >
            {!isSubmitting ? $content.vote : <Spinner variant="light" />}
          </Button>
        </motion.div>
      )}
      {!showFinalResults && (
        <div className={'pt-5'}>
          <ProgressBar
            color={color}
            duration={duration}
            startTime={startTime}
          />
        </div>
      )}
    </PollContainer>
  );
};

ViewerPoll.defaultProps = {
  totalVotes: 0,
  selectedOption: ''
};

ViewerPoll.propTypes = {
  question: PropTypes.string.isRequired,
  votes: PropTypes.arrayOf(
    PropTypes.shape({
      option: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired
    })
  ).isRequired,
  showFinalResults: PropTypes.bool.isRequired,
  totalVotes: PropTypes.number.isRequired,
  highestCountOption: PropTypes.string.isRequired,
  duration: PropTypes.number.isRequired,
  selectedOption: PropTypes.string,
  startTime: PropTypes.number.isRequired,
  isVoting: PropTypes.bool.isRequired,
  isSubmitting: PropTypes.bool.isRequired
};

export default ViewerPoll;
