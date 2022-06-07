import { Link, useOutletContext } from 'react-router-dom';
import { useEffect } from 'react';

import './StreamSession.css';
import { dashboard as $dashboardContent } from '../../../../content';
import { SyncError } from '../../../../assets/icons';
import { useModal } from '../../../../contexts/Modal';
import StaticNotification from '../../../../components/StaticNotification';
import EncoderConfiguration from './EncoderConfiguration';
import Metrics from './Metrics';
import StatsCard from './StatsCard/StatsCard';
import usePrevious from '../../../../hooks/usePrevious';
import Button from '../../../../components/Button';

const $notificationWithCTAContent =
  $dashboardContent.stream_session_page.notification_with_cta;
const $liveStreamEndedModalContent =
  $dashboardContent.modal.live_stream_ended_modal;

const StreamSession = () => {
  const { closeModal, openModal } = useModal();
  const {
    activeStreamSession,
    fetchActiveStreamSessionError,
    fetchStreamSessionsError,
    hasStreamSessions,
    isLoadingStreamData,
    refreshCurrentActiveStreamSession,
    refreshCurrentStreamSessions
  } = useOutletContext();
  const prevActiveStreamSession = usePrevious(activeStreamSession);
  const shouldShowFailedToLoadNotif =
    !!fetchStreamSessionsError || !!fetchActiveStreamSessionError;
  const shouldShowNewUserNotif = hasStreamSessions === false;
  let message = $notificationWithCTAContent.stream_instructions;

  if (shouldShowFailedToLoadNotif) {
    message = !!fetchStreamSessionsError
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
        cancellable: false,
        confirmText: $liveStreamEndedModalContent.okay,
        message: $liveStreamEndedModalContent.live_stream_ended,
        onConfirm: closeModal,
        subMessage: $liveStreamEndedModalContent.live_stream_ended_message
      });
    }
  }, [activeStreamSession, closeModal, openModal, prevActiveStreamSession]);

  return (
    <article className="stream-session">
      {(shouldShowFailedToLoadNotif || shouldShowNewUserNotif) && (
        <StaticNotification
          cta={
            shouldShowFailedToLoadNotif ? (
              <Button
                customStyles={{ width: '117px' }}
                isLoading={isLoadingStreamData}
                onClick={
                  !!fetchStreamSessionsError
                    ? () => refreshCurrentStreamSessions()
                    : () => refreshCurrentActiveStreamSession()
                }
                variant="text"
              >
                {$notificationWithCTAContent.try_again}
              </Button>
            ) : (
              <Link to="/settings">{$notificationWithCTAContent.settings}</Link>
            )
          }
          icon={shouldShowFailedToLoadNotif ? <SyncError /> : null}
          message={message}
        />
      )}
      <StatsCard />
      <Metrics />
      <EncoderConfiguration />
    </article>
  );
};

export default StreamSession;
