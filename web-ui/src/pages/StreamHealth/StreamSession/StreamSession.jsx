import { useEffect } from 'react';

import { clsm } from '../../../utils';
import { dashboard as $dashboardContent } from '../../../content';
import { useModal } from '../../../contexts/Modal';
import { useStreams } from '../../../contexts/Streams';
import Button from '../../../components/Button';
import EncoderConfiguration from './EncoderConfiguration';
import Metrics from './Metrics';
import StaticNotification from '../../../components/StaticNotification';
import usePrevious from '../../../hooks/usePrevious';
import StatusBar from '../../../components/StatusBar';
import withVerticalScroller from '../../../components/withVerticalScroller';

const $notificationWithCTAContent =
  $dashboardContent.stream_session_page.notification_with_cta;
const $liveStreamEndedModalContent =
  $dashboardContent.modal.live_stream_ended_modal;

const StreamSession = () => {
  const { openModal } = useModal();
  const {
    activeStreamSession,
    fetchActiveStreamSessionError,
    fetchStreamSessionsError,
    hasStreamSessions,
    isLoadingStreamData,
    refreshCurrentActiveStreamSession,
    refreshCurrentStreamSessionsWithLoading
  } = useStreams();
  const prevActiveStreamSession = usePrevious(activeStreamSession);
  const shouldShowFailedToLoadNotif =
    !!fetchStreamSessionsError || !!fetchActiveStreamSessionError;
  const shouldShowNewUserNotif = hasStreamSessions === false;
  let ctaMessage = $notificationWithCTAContent.stream_instructions;

  if (shouldShowFailedToLoadNotif) {
    ctaMessage = !!fetchStreamSessionsError
      ? $notificationWithCTAContent.failed_to_load_sessions
      : $notificationWithCTAContent.failed_to_load_session;
  }

  // Inform the user that the currently monitored stream has ended
  useEffect(() => {
    if (!prevActiveStreamSession || !activeStreamSession) return;

    if (
      prevActiveStreamSession.streamId === activeStreamSession.streamId &&
      prevActiveStreamSession.isLive &&
      !activeStreamSession.isLive
    ) {
      openModal({
        content: {
          confirmText: $liveStreamEndedModalContent.reload,
          message: $liveStreamEndedModalContent.live_stream_ended,
          subMessage: $liveStreamEndedModalContent.live_stream_ended_message
        },
        onConfirm: () => refreshCurrentActiveStreamSession(),
        onCancel: () => activeStreamSession.setStale(true)
      });
    }
  }, [
    activeStreamSession,
    openModal,
    prevActiveStreamSession,
    refreshCurrentActiveStreamSession
  ]);

  return (
    <article
      className={clsm([
        'bg-white',
        'dark:bg-black',
        'flex-col',
        'flex',
        'items-center',
        'justify-center',
        'max-w-[960px]',
        'mb-[90px]',
        'mx-auto',
        'px-4',
        'relative',
        'w-full'
      ])}
    >
      {(shouldShowFailedToLoadNotif || shouldShowNewUserNotif) && (
        <StaticNotification
          cta={
            shouldShowFailedToLoadNotif ? (
              <Button
                className="w-[117px]"
                isLoading={isLoadingStreamData}
                onClick={
                  !!fetchStreamSessionsError
                    ? () => refreshCurrentStreamSessionsWithLoading()
                    : () => refreshCurrentActiveStreamSession()
                }
                variant="primaryText"
              >
                {$notificationWithCTAContent.try_again}
              </Button>
            ) : (
              <Button className="sm:w-full" type="nav" to="/settings">
                {$notificationWithCTAContent.settings}
              </Button>
            )
          }
          message={ctaMessage}
        />
      )}
      <StatusBar />
      <Metrics />
      <EncoderConfiguration />
    </article>
  );
};

export default withVerticalScroller(StreamSession, {
  containerClasses: ['h-[calc(100vh_-_64px)]']
});
