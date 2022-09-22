import { useEffect, useRef } from 'react';

import { clsm } from '../../utils';
import { Provider as NotificationProvider } from '../../contexts/Notification';
import { streamManager as $streamManager } from '../../content';
import { useManagerStreamActions } from '../../contexts/ManagerStreamActions';
import { useStreams } from '../../contexts/Streams';
import Button from '../../components/Button';
import ManagerStreamActionModal from './ManagerStreamActions/ManagerStreamActionModal';
import Notification from '../../components/Notification';
import Quiz from './ManagerStreamActions/ManagerStreamActionForms/Quiz';
import StatusBar from './StatusBar';
import ManagerStreamActions from './ManagerStreamActions';
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

  /* TEMPORARY - provided as example */
  const { openManagerStreamActionModal } = useManagerStreamActions();
  const managerStreamActionButtonRef = useRef();
  const openQuizManagerStreamAction = () => {
    openManagerStreamActionModal({
      content: {
        title: $streamManager.manager_stream_actions_modal.quiz.host_a_quiz,
        confirmText:
          $streamManager.manager_stream_actions_modal.quiz.start_quiz,
        managerStreamActionContent: <Quiz />
      },
      lastFocusedElement: managerStreamActionButtonRef
    });
  };

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
        <Notification className={clsm(['fixed', 'z-[1001]'])} />
        <ManagerStreamActionModal />
      </NotificationProvider>

      {/* TEMPORARY - provided as example */}
      <Button
        className={clsm(['mb-6'])}
        ref={managerStreamActionButtonRef}
        onClick={openQuizManagerStreamAction}
      >
        Open a Sample Modal
      </Button>
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
        <ManagerStreamActions />
        <StreamManagerChat siblingRef={streamManagerRef} />
      </div>
    </div>
  );
};

export default withVerticalScroller(StreamManager);
