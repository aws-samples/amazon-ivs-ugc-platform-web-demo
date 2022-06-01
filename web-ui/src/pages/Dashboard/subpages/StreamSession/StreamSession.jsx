import { Link, useOutletContext } from 'react-router-dom';
import { useEffect } from 'react';

import './StreamSession.css';
import { dashboard as $content } from '../../../../content';
import { SyncError } from '../../../../assets/icons';
import { useModal } from '../../../../contexts/Modal';
import StaticNotification from '../../../../components/StaticNotification';
import EncoderConfiguration from './EncoderConfiguration';
import Metrics from './Metrics';
import StatsCard from './StatsCard/StatsCard';
import usePrevious from '../../../../hooks/usePrevious';
import Button from '../../../../components/Button';

const StreamSession = () => {
  const { closeModal, openModal } = useModal();
  const {
    activeStreamSession,
    activeStreamSessionError,
    refreshCurrentActiveStreamSession,
    isInitialLoadingActiveStreamSession,
    isLoadingActiveSession,
    hasStreamSessions
  } = useOutletContext();
  const prevSession = usePrevious(activeStreamSession);
  const shouldShowFailedToLoadNotif =
    !isInitialLoadingActiveStreamSession && !!activeStreamSessionError;
  const shouldShowNewUserNotif = hasStreamSessions === false;

  // Inform the user that the currently monitored stream has ended
  useEffect(() => {
    if (!prevSession || !activeStreamSession) return;

    if (
      prevSession.streamId === activeStreamSession.streamId &&
      prevSession.isLive &&
      !activeStreamSession.isLive
    ) {
      openModal({
        cancellable: false,
        confirmText: $content.modal.live_stream_ended_modal.okay,
        message: $content.modal.live_stream_ended_modal.live_stream_ended,
        onConfirm: closeModal,
        subMessage:
          $content.modal.live_stream_ended_modal.live_stream_ended_message
      });
    }
  }, [activeStreamSession, closeModal, openModal, prevSession]);

  return (
    <article className="stream-session">
      {(shouldShowFailedToLoadNotif || shouldShowNewUserNotif) && (
        <StaticNotification
          cta={
            shouldShowFailedToLoadNotif ? (
              <Button
                customStyles={{ width: '117px' }}
                isLoading={isLoadingActiveSession}
                onClick={refreshCurrentActiveStreamSession}
                variant="text"
              >
                {$content.stream_session_page.notification_with_cta.try_again}
              </Button>
            ) : (
              <Link to="/settings">
                {$content.stream_session_page.notification_with_cta.settings}
              </Link>
            )
          }
          icon={shouldShowFailedToLoadNotif ? <SyncError /> : null}
          message={
            shouldShowFailedToLoadNotif
              ? $content.stream_session_page.notification_with_cta
                  .failed_to_load
              : $content.stream_session_page.notification_with_cta
                  .stream_instructions
          }
        />
      )}
      <StatsCard />
      <Metrics />
      <EncoderConfiguration />
    </article>
  );
};

export default StreamSession;
