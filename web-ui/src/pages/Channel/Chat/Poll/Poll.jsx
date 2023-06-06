import { clsm } from '../../../../utils';
import { useLocation } from 'react-router-dom';

import StreamerPoll from './StreamerPoll';
import ViewerPoll from './ViewerPoll';
import useChatConnection from '../useChatConnection';
import { usePoll } from '../../../../contexts/StreamManagerActions/Poll';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import { useChannel } from '../../../../contexts/Channel';

const Poll = () => {
  // TODO: replace with chat SDK
  const {
    isActive,
    question,
    votes,
    showFinalResults,
    highestCountOption,
    totalVotes
  } = usePoll();

  const { isModerator } = useChatConnection();
  const { pathname } = useLocation();
  const { isDesktopView } = useResponsiveDevice();
  const { channelData } = useChannel();

  const isStreamManagerPage = pathname === '/manager';

  const commonPollProps = {
    totalVotes,
    question,
    votes,
    showFinalResults,
    highestCountOption: highestCountOption.option
  };

  return (
    isActive &&
    !!channelData && (
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
          'z-50'
        ])}
      >
        {isModerator && isStreamManagerPage && (
          <StreamerPoll {...commonPollProps} isActive={isActive} />
        )}
        {!isStreamManagerPage && <ViewerPoll {...commonPollProps} />}
      </div>
    )
  );
};

export default Poll;
