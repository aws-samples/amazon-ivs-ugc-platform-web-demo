import { useEffect } from 'react';

import { clsm } from '../../utils';
import { useStreams } from '../../contexts/Streams';
import StatusBar from './StatusBar';
import useStreamSessionData from '../../contexts/Streams/useStreamSessionData';
import withVerticalScroller from '../../components/withVerticalScroller';

const StreamManager = () => {
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
        'gap-y-6',
        'h-screen',
        'items-center',
        'overflow-auto',
        'px-8',
        'py-6',
        'sm:px-4',
        'w-full'
      )}
    >
      <StatusBar />
    </div>
  );
};

export default withVerticalScroller(StreamManager);
