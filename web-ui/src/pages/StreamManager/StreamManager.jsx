import { useEffect, useRef } from 'react';

import { clsm } from '../../utils';
import { HIDE_WIP_STREAM_ACTIONS } from '../../constants';
import { Provider as NotificationProvider } from '../../contexts/Notification';
import { Provider as StreamManagerActionsProvider } from '../../contexts/StreamManagerActions';
import { useStreams } from '../../contexts/Streams';
import Notification from '../../components/Notification';
import StatusBar from './StatusBar';
import StreamManagerActionModal from './StreamManagerActions/StreamManagerActionModal';
import StreamManagerActions from './StreamManagerActions';
import StreamManagerChat from './StreamManagerChat';
import useStreamSessionData from '../../contexts/Streams/useStreamSessionData';
import withVerticalScroller from '../../components/withVerticalScroller';

const StreamManager = () => {
  const streamManagerRef = useRef();
  const { isLive, streamSessions, setStreamSessions } = useStreams();
  const { updateStreamSessionDataFetchKey } = useStreamSessionData({
    isLive,
    setStreamSessions,
    streamSessions
  });

  useEffect(() => {
    if (isLive) {
      const latestStreamSession = streamSessions[0];
      updateStreamSessionDataFetchKey(latestStreamSession);
    }
  }, [isLive, streamSessions, updateStreamSessionDataFetchKey]);

  return (
    <div
      className={clsm(
        'flex-col',
        'flex',
        'h-screen',
        'items-center',
        'overflow-auto',
        'px-8',
        'py-6',
        'sm:px-4',
        'supports-overlay:overflow-overlay',
        'w-full'
      )}
    >
      <StatusBar />
      <NotificationProvider>
        <StreamManagerActionsProvider>
          <Notification />
          <StreamManagerActionModal />
          <div
            ref={streamManagerRef}
            className={clsm([
              'flex',
              'gap-6',
              'h-full',
              'lg:grid-rows-[188px,minmax(200px,100%)]',
              'lg:grid',
              'max-w-[960px]',
              'sm:grid-rows-[minmax(0,auto),minmax(200px,100%)]',
              'w-full',
              !HIDE_WIP_STREAM_ACTIONS &&
                'xs:grid-rows-[170px,minmax(200px,100%)]'
            ])}
          >
            <StreamManagerActions />
            <StreamManagerChat siblingRef={streamManagerRef} />
          </div>
        </StreamManagerActionsProvider>
      </NotificationProvider>
    </div>
  );
};

export default withVerticalScroller(StreamManager);
