import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

import { clsm } from '../../../../utils';
import StreamerPoll from './StreamerPoll';
import ViewerPoll from './ViewerPoll';
import { useChannel } from '../../../../contexts/Channel';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import { useChat } from '../../../../contexts/Chat';
import { usePoll } from '../../../../contexts/StreamManagerActions/Poll';

const Poll = ({ shouldRenderInTab }) => {
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
  const { isModerator } = useChat();
  const { pathname } = useLocation();
  const { isDesktopView, isLandscape } = useResponsiveDevice();
  const { channelData } = useChannel();

  const isStreamManagerPage = pathname === '/manager';

  const commonPollProps = {
    ...pollProps,
    totalVotes,
    question,
    votes,
    showFinalResults,
    highestCountOption: highestCountOption.option,
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
          <ViewerPoll
            {...commonPollProps}
            startTime={startTime}
            shouldRenderInTab={shouldRenderInTab}
          />
        )}
      </div>
    )
  );
};

Poll.defaultProps = {
  shouldRenderInTab: false
};

Poll.propTypes = {
  shouldRenderInTab: PropTypes.bool
};

export default Poll;
