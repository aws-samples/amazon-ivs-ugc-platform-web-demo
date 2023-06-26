import { clsm } from '../../../../utils';

import { useChannel } from '../../../../contexts/Channel';
import { useChat } from '../../../../contexts/Chat';
import { useLocation } from 'react-router-dom';
import { usePoll } from '../../../../contexts/StreamManagerActions/Poll';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import StreamerPoll from './StreamerPoll';
import ViewerPoll from './ViewerPoll';

const Poll = () => {
  const {
    isActive,
    question,
    votes,
    showFinalResults,
    highestCountOption,
    totalVotes,
    selectedOption,
    duration,
    hasListReordered,
    isExpanded,
    isVoting,
    isSubmitting,
    startTime,
    setIsVoting,
    setSelectedOption,
    noVotesCaptured,
    tieFound
  } = usePoll();
  const pollProps = {
    isActive,
    question,
    votes,
    showFinalResults,
    highestCountOption,
    totalVotes,
    selectedOption,
    duration,
    hasListReordered,
    isExpanded,
    isVoting,
    isSubmitting,
    setIsVoting,
    setSelectedOption,
    noVotesCaptured,
    tieFound
  };
  const { pathname } = useLocation();
  const { channelData } = useChannel();
  const { isModerator } = useChat();
  const { isDesktopView, isLandscape } = useResponsiveDevice();

  const isStreamManagerPage = pathname === '/manager';

  const commonPollProps = {
    ...pollProps,
    totalVotes,
    question,
    votes,
    showFinalResults,
    highestCountOption: highestCountOption?.option,
    duration,
    hasListReordered
  };

  return (
    !!channelData &&
    votes.length > 0 && (
      <div
        className={clsm([
          !isStreamManagerPage && [
            'no-scrollbar',
            'overflow-y-auto',
            'supports-overlay:overflow-y-overlay',
            !isDesktopView && ['pb-20', 'h-full']
          ],
          'w-full',
          'absolute',
          'z-50',
          isLandscape && 'mb-[110px]'
        ])}
      >
        {isModerator && isStreamManagerPage && (
          <StreamerPoll {...commonPollProps} />
        )}
        {!isStreamManagerPage && (
          <ViewerPoll {...commonPollProps} startTime={startTime} />
        )}
      </div>
    )
  );
};

export default Poll;
