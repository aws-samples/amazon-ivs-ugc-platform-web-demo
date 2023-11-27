import { getParticipationToken } from '../../../api/stages';
import { PARTICIPANT_TYPES } from '../../../contexts/Stage/Global/reducer/globalReducer';
import { streamManager as $streamManagerContent } from '../../../content';
import { useCallback, useEffect, useState } from 'react';
import { useGlobalStage } from '../../../contexts/Stage';
import useThrottledCallback from '../../../hooks/useThrottledCallback';
import useLatest from '../../../hooks/useLatest';
import { captureScreenShareStream } from '../../../contexts/Broadcast/useScreenShare/utils';

const $contentNotification =
  $streamManagerContent.stream_manager_stage.notifications;
const { LocalStageStream } = window.IVSBroadcastClient;

const useStageScreenshare = ({
  joinStageScreenshareClient,
  leaveStageScreenshareClient
}) => {
  const [screenCaptureStream, setScreenCapturedStream] = useState(null);
  const screenCaptureStreamTracks = useLatest(
    screenCaptureStream?.getTracks() || []
  );

  const {
    stageId,
    updateIsScreensharing,
    isScreensharing,
    screenshareStrategy,
    updateError
  } = useGlobalStage();

  const startScreenshare = useCallback(async () => {
    try {
      const screenshareMedia = await captureScreenShareStream();
      const screenshareVideoStream = new LocalStageStream(
        screenshareMedia.getVideoTracks()[0]
      );
      setScreenCapturedStream(screenshareMedia);
      screenshareStrategy.setStream(screenshareVideoStream);

      const { result, error } = await getParticipationToken(
        stageId,
        PARTICIPANT_TYPES.SCREENSHARE
      );

      if (result?.token) {
        const { token } = result;
        await joinStageScreenshareClient({
          token,
          strategy: screenshareStrategy,
          shouldattachEvents: false
        });
        updateIsScreensharing(true);
      }

      if (error) {
        setScreenCapturedStream(null);
        screenshareStrategy.resetStrategy();
        updateError({
          message: $contentNotification.error.unable_to_start_screenshare,
          err: error
        });
      }
    } catch (error) {
      console.error('Failed to start screen share', error);
    }
  }, [
    joinStageScreenshareClient,
    screenshareStrategy,
    stageId,
    updateError,
    updateIsScreensharing
  ]);

  const stopScreenshare = useCallback(() => {
    // Stop and close the media tracks bound to the shared screen
    for (const track of screenCaptureStreamTracks.current) track.stop();

    screenshareStrategy.resetStrategy();
    setScreenCapturedStream(null);
    leaveStageScreenshareClient({
      shouldUpdateStrategy: false,
      shouldRemoveAllEventListeners: false
    });
    updateIsScreensharing(false);
  }, [
    leaveStageScreenshareClient,
    screenCaptureStreamTracks,
    screenshareStrategy,
    updateIsScreensharing
  ]);

  const startStopScreenshare = useCallback(() => {
    if (isScreensharing) stopScreenshare();
    else startScreenshare();
  }, [isScreensharing, startScreenshare, stopScreenshare]);

  const toggleScreenshare = useThrottledCallback(startStopScreenshare, 250);

  useEffect(() => {
    const [screenCaptureTrack] = screenCaptureStream?.getVideoTracks() || [];

    if (screenCaptureTrack)
      screenCaptureTrack.addEventListener('ended', stopScreenshare);

    return () => {
      if (screenCaptureTrack)
        screenCaptureTrack.removeEventListener('ended', stopScreenshare);
    };
  }, [screenCaptureStream, stopScreenshare]);

  return {
    toggleScreenshare
  };
};

export default useStageScreenshare;
