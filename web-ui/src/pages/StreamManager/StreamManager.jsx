import { useEffect, useState, useRef } from 'react';

import { clsm } from '../../utils';
import {
  Provider as NotificationProvider,
  useNotif
} from '../../contexts/Notification';
import { Provider as PollProvider } from '../../contexts/StreamManagerActions/Poll';
import { Provider as ChatProvider } from '../../contexts/Chat';
import { Provider as StreamManagerActionsProvider } from '../../contexts/StreamManagerActions';
import { Provider as StreamManagerWebBroadcastProvider } from '../../contexts/Broadcast';
import { Provider as BroadcastFullscreenProvider } from '../../contexts/BroadcastFullscreen';
import { useStreams } from '../../contexts/Streams';
import { useUser } from '../../contexts/User';
import Notification from '../../components/Notification';
import StatusBar from '../../components/StatusBar';
import StreamManagerControlCenter from './StreamManagerControlCenter';
import useStreamSessionData from '../../contexts/Streams/useStreamSessionData';
import withVerticalScroller from '../../components/withVerticalScroller';
import { useGlobal } from '../../contexts/Stage/Global';

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

  /**
   * Notify stage success and errors
   */
  const { success, error, updateSuccess, updateError } = useGlobal();
  const { notifyError, notifySuccess } = useNotif();

  useEffect(() => {
    if (error) {
      const { message, err } = error;
      if (err) console.error(err, message);

      if (message) notifyError(message, { asPortal: true });

      updateError(null);
    }

    if (success) {
      notifySuccess(success, { asPortal: true });

      updateSuccess(null);
    }
  }, [success, error, updateSuccess, updateError, notifyError, notifySuccess]);

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
      <PollProvider>
        <NotificationProvider>
          <StreamManagerWebBroadcastProvider
            previewRef={previewRef}
            ingestEndpoint={ingestEndpoint}
            streamKey={streamKey}
          >
            <BroadcastFullscreenProvider previewRef={previewRef}>
              <ChatProvider>
                <StreamManagerActionsProvider>
                  <Notification />
                  <StreamManagerControlCenter
                    ref={previewRef}
                    setIsWebBroadcastAnimating={setIsWebBroadcastAnimating}
                  />
                </StreamManagerActionsProvider>
              </ChatProvider>
            </BroadcastFullscreenProvider>
          </StreamManagerWebBroadcastProvider>
        </NotificationProvider>
      </PollProvider>
    </div>
  );
};

export default withVerticalScroller(StreamManager);
