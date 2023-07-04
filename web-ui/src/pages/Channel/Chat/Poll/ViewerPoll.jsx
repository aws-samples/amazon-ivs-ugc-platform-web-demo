import { useCallback, useRef, useEffect } from 'react';
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
import PollContainer from './PollContainer';
import { useChat } from '../../../../contexts/Chat';
import { useUser } from '../../../../contexts/User';
import AnimatedVoteItems from './AnimatedVoteItems';

const $content =
  $streamManagerContent.stream_manager_actions[STREAM_ACTION_NAME.POLL];

const ViewerPoll = ({ shouldRenderInTab }) => {
  const { SUBMIT_VOTE } = CHAT_MESSAGE_EVENT_TYPES;
  const {
    actions: { sendMessage }
  } = useChat();
  const { isTouchscreenDevice } = useResponsiveDevice();
  const {
    noVotesCaptured,
    tieFound,
    isSubmitting,
    selectedOption,
    startTime,
    duration,
    isVoting,
    setPollRef,
    dispatchPollState,
    question,
    showFinalResults,
    hasScrollbar,
    hasPollEnded
  } = usePoll();
  const { channelData } = useChannel();
  const { color } = channelData || {};
  const { userData = undefined } = useUser();
  const { trackingId = undefined } = userData || {};
  const inputDivControls = useAnimationControls();
  const buttonDivControls = useAnimationControls();
  const radioBoxControls = useAnimationControls();
  const shouldRenderVoteButton =
    !showFinalResults && isVoting && !noVotesCaptured && !!userData;

  const textColor = PROFILE_COLORS_WITH_WHITE_TEXT.includes(color)
    ? 'white'
    : 'black';

  const submitVote = useCallback(async () => {
    dispatchPollState({ isSubmitting: true });

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

    dispatchPollState({ isVoting: false });
    const result = await sendMessage(SUBMIT_VOTE, {
      voter: trackingId,
      eventType: SUBMIT_VOTE,
      option: selectedOption,
      duration: JSON.stringify(duration),
      startTime: JSON.stringify(startTime)
    });

    if (result) {
      dispatchPollState({ isSubmitting: true });
    }
  }, [
    SUBMIT_VOTE,
    buttonDivControls,
    duration,
    inputDivControls,
    radioBoxControls,
    selectedOption,
    sendMessage,
    startTime,
    trackingId,
    dispatchPollState
  ]);

  const pollRef = useRef();

  useEffect(() => {
    if (pollRef?.current) {
      dispatchPollState({ pollRef: pollRef.current });
    }
  }, [dispatchPollState, pollRef, setPollRef]);

  const showVoteAndProgress = !hasPollEnded && !showFinalResults;
  const showVoteAndProgressAsFooter = hasScrollbar && !shouldRenderInTab;

  const renderProgressBar = (
    <>
      {!showFinalResults && !noVotesCaptured && !tieFound && (
        <div className="pt-5">
          <ProgressBar
            color={color}
            duration={duration}
            startTime={startTime}
          />
        </div>
      )}
    </>
  );

  const renderVoteButton = (
    <>
      {shouldRenderVoteButton && (
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
    </>
  );

  return (
    <>
      <PollContainer
        ref={pollRef}
        isViewer={true}
        shouldRenderInTab={shouldRenderInTab}
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
            <AnimatedVoteItems
              textColor={textColor}
              inputDivControls={inputDivControls}
              radioBoxControls={radioBoxControls}
              showVotePercentage
            />
          </AnimatePresence>
        </div>
        {showVoteAndProgress && !showVoteAndProgressAsFooter && (
          <>
            {renderVoteButton}
            {renderProgressBar}
          </>
        )}
      </PollContainer>
      {showVoteAndProgress && showVoteAndProgressAsFooter && (
        <>
          <div
            style={{ width: '320px', height: '1px', margin: 'auto' }}
            className={[`bg-profile-${color}-dark`]}
          />
          <footer
            className={clsm([
              'w-[320px]',
              'm-auto',
              `bg-profile-${color}`,
              'rounded-b-xl',
              'p-5',
              'pt-0'
            ])}
          >
            {renderProgressBar}
            {renderVoteButton}
          </footer>
        </>
      )}
    </>
  );
};

ViewerPoll.propTypes = {
  shouldRenderInTab: PropTypes.string.isRequired
};

export default ViewerPoll;
