import { useEffect } from 'react';

import { getVideoConstraints } from '../../../helpers/stagesHelpers';
import { LOCAL_STAGE_STREAM_OPTIONS } from '../../../constants';
import { retryWithExponentialBackoff } from '../../../utils';
import { streamManager as $streamManagerContent } from '../../../content';
import { TRACK_READY_STATE } from './useStageStrategy';
import { useGlobalStage } from '../../../contexts/Stage';
import { LOCAL_KEY } from '../../../contexts/Stage/Global/reducer/globalReducer';

const $contentBroadcastNotif =
  $streamManagerContent.stream_manager_web_broadcast.notifications;

const { LocalStageStream } = window.IVSBroadcastClient;

const useLocalVideoStream = ({
  prevActiveCameraDevice,
  activeCameraDevice,
  strategy,
  updateError
}) => {
  const { isStageActive, isSpectator, localParticipant, updateStreams } =
    useGlobalStage();

  /**
   * Local participant media stream
   */
  // Get local video only stream and update video src object
  useEffect(() => {
    if (!isStageActive || isSpectator || !prevActiveCameraDevice) return;

    const isInitializingStreams = !localParticipant?.streams;
    const isActiveCamTrackStopped =
      !localParticipant?.isCameraHidden &&
      localParticipant.streams?.[0].mediaStreamTrack.readyState ===
        TRACK_READY_STATE.ENDED;
    const isActiveCamDeviceUpdated =
      prevActiveCameraDevice?.deviceId !== activeCameraDevice?.deviceId;

    if (
      !isInitializingStreams &&
      !isActiveCamTrackStopped &&
      !isActiveCamDeviceUpdated
    )
      return;

    // Stop previous track
    if (
      localParticipant?.streams &&
      localParticipant?.streams?.[0].mediaStreamTrack.readyState ===
        TRACK_READY_STATE.LIVE
    ) {
      localParticipant.streams?.[0].mediaStreamTrack.stop();
    }

    const { deviceId: cameraDeviceId = undefined } = activeCameraDevice || {};
    if (cameraDeviceId) {
      (async function () {
        try {
          const localVideoStream = await retryWithExponentialBackoff({
            promiseFn: () =>
              navigator.mediaDevices.getUserMedia({
                video: getVideoConstraints(cameraDeviceId)
              }),
            maxRetries: 2
          });

          if (localVideoStream) {
            const localVideoTrack = new LocalStageStream(
              localVideoStream.getVideoTracks()[0],
              LOCAL_STAGE_STREAM_OPTIONS
            );
            updateStreams(LOCAL_KEY, [localVideoTrack]);
          }
        } catch (error) {
          updateError({
            message: $contentBroadcastNotif.error.failed_to_change_camera,
            err: error
          });
        }
      })();
    }
  }, [
    activeCameraDevice,
    isStageActive,
    localParticipant?.isCameraHidden,
    updateStreams,
    isSpectator,
    localParticipant?.streams,
    prevActiveCameraDevice,
    updateError
  ]);

  useEffect(() => {
    if (
      localParticipant?.isCameraHidden &&
      strategy.videoTrack?.mediaStreamTrack?.enabled
    ) {
      strategy.videoTrack?.mediaStreamTrack.stop();
      localParticipant?.streams?.[0]?.mediaStreamTrack.stop();
    }
  }, [
    localParticipant?.isCameraHidden,
    localParticipant?.streams,
    strategy.videoTrack?.mediaStreamTrack
  ]);
};

export default useLocalVideoStream;
