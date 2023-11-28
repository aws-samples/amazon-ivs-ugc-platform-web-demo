import { getParticipationToken } from '../../../api/stages';
import { PARTICIPANT_TYPES } from '../../../contexts/Stage/Global/reducer/globalReducer';
import { streamManager as $streamManagerContent } from '../../../content';
import { useCallback, useEffect } from 'react';
import { useGlobalStage } from '../../../contexts/Stage';
import useThrottledCallback from '../../../hooks/useThrottledCallback';
import { captureScreenShareStream } from '../../../contexts/Broadcast/useScreenShare/utils';

const $contentNotification =
  $streamManagerContent.stream_manager_stage.notifications;
const { LocalStageStream } = window.IVSBroadcastClient;

const useStageScreenshare = ({
  joinStageScreenshareClient,
  leaveStageScreenshareClient
}) => {
  const {
    isScreensharePermissionRevoked,
    isScreensharing,
    localScreenshareStream,
    screenshareStrategy,
    stageId,
    updateError,
    updateIsScreensharePermissionRevoked,
    updateIsScreensharing,
    updateLocalScreenshareStream
  } = useGlobalStage();

  const startScreenshare = useCallback(async () => {
    try {
      const screenshareMedia = await captureScreenShareStream();
      const screenshareVideoStream = new LocalStageStream(
        screenshareMedia.getVideoTracks()[0]
      );
      updateLocalScreenshareStream(screenshareMedia);
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
        updateLocalScreenshareStream(null);
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
    updateIsScreensharing,
    updateLocalScreenshareStream
  ]);

  const stopScreenshare = useCallback(() => {
    // Stop and close the media tracks bound to the shared screen
    for (const track of localScreenshareStream?.getTracks()) track.stop();
    screenshareStrategy.stopTracks();

    updateLocalScreenshareStream(null);
    leaveStageScreenshareClient(screenshareStrategy);
    updateIsScreensharing(false);
  }, [
    leaveStageScreenshareClient,
    localScreenshareStream,
    screenshareStrategy,
    updateIsScreensharing,
    updateLocalScreenshareStream
  ]);

  const startStopScreenshare = useCallback(() => {
    if (isScreensharing) stopScreenshare();
    else startScreenshare();
  }, [isScreensharing, startScreenshare, stopScreenshare]);

  const toggleScreenshare = useThrottledCallback(startStopScreenshare, 250);

  useEffect(() => {
    if (!isScreensharePermissionRevoked) return;

    updateIsScreensharePermissionRevoked(false);
    stopScreenshare();
    updateError({
      message: $contentNotification.error.your_screen_share_has_been_removed
    });
  }, [
    isScreensharePermissionRevoked,
    stopScreenshare,
    updateError,
    updateIsScreensharePermissionRevoked
  ]);

  return {
    stopScreenshare,
    toggleScreenshare
  };
};

export default useStageScreenshare;
