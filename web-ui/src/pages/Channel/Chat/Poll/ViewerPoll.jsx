import { useCallback } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import PropTypes from 'prop-types';

import { clsm } from '../../../../utils';
import {
  PROFILE_COLORS_WITH_WHITE_TEXT,
  STREAM_ACTION_NAME,
  CHAT_MESSAGE_EVENT_TYPES
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
import { useChat } from '../../../../contexts/Chat';
import { useUser } from '../../../../contexts/User';
import { useNavigate } from 'react-router-dom';

const $content =
  $streamManagerContent.stream_manager_actions[STREAM_ACTION_NAME.POLL];

const ViewerPoll = ({
  question,
  votes,
  showFinalResults,
  totalVotes,
  highestCountOption
}) => {
  const { SUBMIT_VOTE } = CHAT_MESSAGE_EVENT_TYPES;
  const {
    actions: { sendMessage }
  } = useChat();
  const { isTouchscreenDevice } = useResponsiveDevice();
  const {
    setIsSubmitting,
    setIsVoting,
    noVotesCaptured,
    tieFound,
    isSubmitting,
    selectedOption,
    startTime,
    duration,
    isVoting
  } = usePoll();
  const { channelData } = useChannel();
  const { color } = channelData || {};
  const { userData = undefined } = useUser();
  const { trackingId = undefined } = userData || {};
  const inputDivControls = useAnimationControls();
  const buttonDivControls = useAnimationControls();
  const radioBoxControls = useAnimationControls();
  const navigate = useNavigate();

  const textColor = PROFILE_COLORS_WITH_WHITE_TEXT.includes(color)
    ? 'white'
    : 'black';

  const submitVote = useCallback(async () => {
    if (!userData) {
      navigate('/login');

      return;
    }

    setIsSubmitting(true);

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
    const result = await sendMessage(SUBMIT_VOTE, {
      voter: trackingId,
      eventType: SUBMIT_VOTE,
      option: selectedOption,
      duration: JSON.stringify(duration),
      startTime: JSON.stringify(startTime)
    });

    if (result) {
      setIsSubmitting(false);
    }
  }, [
    SUBMIT_VOTE,
    buttonDivControls,
    duration,
    inputDivControls,
    navigate,
    radioBoxControls,
    selectedOption,
    sendMessage,
    setIsSubmitting,
    setIsVoting,
    startTime,
    trackingId,
    userData
  ]);

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
          {votes.map(({ option, count }, index) => {
            const isHighestCount = option === highestCountOption;
            const percentage =
              (!!count && Math.ceil((count / totalVotes) * 100)) || 0;

            return (
              <VoteItem
                key={option}
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
                noVotesCaptured={noVotesCaptured}
              />
            );
          })}
        </AnimatePresence>
      </div>
      {!showFinalResults && isVoting && !noVotesCaptured && (
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
      {!showFinalResults && !noVotesCaptured && !tieFound && (
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
  highestCountOption: PropTypes.string.isRequired
};

export default ViewerPoll;
