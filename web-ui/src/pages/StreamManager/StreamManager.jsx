import { useEffect, useState } from 'react';

import { clsm } from '../../utils';
import { Provider as NotificationProvider } from '../../contexts/Notification';
import { Provider as ChatProvider } from '../../contexts/Chat';
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
  const [isWebBroadcastAnimating, setIsWebBroadcastAnimating] = useState(false);

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
        'px-8',
        'py-6',
        'sm:px-4',
        'w-full',
        isWebBroadcastAnimating
          ? ['grid-rows-[48px,calc(100vh-48px-48px-24px)]', 'overflow-hidden']
          : [
              'grid-rows-[48px,auto]',
              'overflow-auto',
              'supports-overlay:overflow-overlay'
            ]
      )}
    >
      <StatusBar />
      <NotificationProvider>
        <StreamManagerWebBroadcastProvider
          previewRef={previewRef}
          ingestEndpoint={ingestEndpoint}
          streamKey={streamKey}
        >
          <ChatProvider>
            <StreamManagerActionsProvider>
              <Notification />
              <StreamManagerControlCenter
                ref={previewRef}
                setIsWebBroadcastAnimating={setIsWebBroadcastAnimating}
              />
            </StreamManagerActionsProvider>
          </ChatProvider>
        </StreamManagerWebBroadcastProvider>
      </NotificationProvider>
    </div>
  );
};

export default withVerticalScroller(StreamManager);
