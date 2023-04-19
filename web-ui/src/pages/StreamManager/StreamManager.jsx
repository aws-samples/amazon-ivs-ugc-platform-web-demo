import { useEffect } from 'react';

import { clsm } from '../../utils';
import { Provider as NotificationProvider } from '../../contexts/Notification';
import { Provider as StreamManagerActionsProvider } from '../../contexts/StreamManagerActions';
import { Provider as StreamManagerWebBroadcastProvider } from '../../contexts/Broadcast';
import { useRef } from 'react';
import { useStreams } from '../../contexts/Streams';
import { useUser } from '../../contexts/User';
import Notification from '../../components/Notification';
import StatusBar from '../../components/StatusBar';
import StreamManagerControlCenter from './StreamManagerControlCenter';
import useStreamSessionData from '../../contexts/Streams/useStreamSessionData';
import withVerticalScroller from '../../components/withVerticalScroller';

const StreamManager = () => {
  const { isLive, streamSessions, setStreamSessions } = useStreams();
  const { updateStreamSessionDataFetchKey } = useStreamSessionData({
    isLive,
    setStreamSessions,
    streamSessions
  });
  const { userData } = useUser();
  const { ingestEndpoint, streamKeyValue: streamKey } = userData || {};
  const previewRef = useRef();

  useEffect(() => {
    if (isLive) {
      const latestStreamSession = streamSessions[0];
      updateStreamSessionDataFetchKey(latestStreamSession);
    }
  }, [isLive, streamSessions, updateStreamSessionDataFetchKey]);

  return (
    <div
      className={clsm(
        'gap-6',
        'grid-rows-[48px,auto]',
        'grid',
        'h-screen',
        'justify-items-center',
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
        <StreamManagerWebBroadcastProvider
          previewRef={previewRef}
          ingestEndpoint={ingestEndpoint}
          streamKey={streamKey}
        >
          <StreamManagerActionsProvider>
            <Notification />
            <StreamManagerControlCenter ref={previewRef} />
          </StreamManagerActionsProvider>
        </StreamManagerWebBroadcastProvider>
      </NotificationProvider>
    </div>
  );
};

export default withVerticalScroller(StreamManager);
