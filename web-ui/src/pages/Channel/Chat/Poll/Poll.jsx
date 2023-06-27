import { clsm } from '../../../../utils';

import { useChat } from '../../../../contexts/Chat';
import { useLocation } from 'react-router-dom';
import { usePoll } from '../../../../contexts/StreamManagerActions/Poll';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import StreamerPoll from './StreamerPoll';
import ViewerPoll from './ViewerPoll';

const Poll = () => {
  const { votes } = usePoll();
  const { pathname } = useLocation();
  const { isModerator } = useChat();
  const { isDesktopView, isLandscape } = useResponsiveDevice();
  const isStreamManagerPage = pathname === '/manager';

  return (
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
        {isModerator && isStreamManagerPage && <StreamerPoll />}
        {!isStreamManagerPage && <ViewerPoll />}
      </div>
    )
  );
};

export default Poll;
