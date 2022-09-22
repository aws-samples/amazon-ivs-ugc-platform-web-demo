import { useEffect, useRef } from 'react';

import { clsm } from '../../utils';
import { useStreams } from '../../contexts/Streams';
import StreamManagerChat from './StreamManagerChat';
import StatusBar from './StatusBar';
import StreamActions from './StreamActions';
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
      <div
        ref={streamManagerRef}
        className={clsm([
          'flex',
          'gap-6',
          'h-full',
          'lg:grid-rows-[188px,minmax(200px,100%)]',
          'lg:grid',
          'max-w-[960px]',
          'sm:grid-rows-[minmax(105px,auto),minmax(200px,100%)]',
          'w-full'
        ])}
      >
        <StreamActions />
        <StreamManagerChat siblingRef={streamManagerRef} />
      </div>
    </div>
  );
};

export default withVerticalScroller(StreamManager);
