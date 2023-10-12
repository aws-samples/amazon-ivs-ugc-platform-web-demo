import { useCallback, useEffect } from 'react';

import { CAMERA_LAYER_NAME } from '../../../contexts/Broadcast/useLayers';
import { LOCAL_STAGE_STREAM_OPTIONS as localStreamOptions } from '../../../constants';
import { MICROPHONE_AUDIO_INPUT_NAME } from '../../../contexts/Broadcast/useAudioMixer';
import { retryWithExponentialBackoff } from '../../../utils';
import { streamManager as $streamManagerContent } from '../../../content';
import { useBroadcast } from '../../../contexts/Broadcast';
import { useGlobalStage } from '../../../contexts/Stage';
import useLocalVideoStream from './useLocalVideoStream';
import usePrevious from '../../../hooks/usePrevious';
import { defaultParticipant } from '../../../contexts/Stage/Global/reducer/globalReducer';

const $contentBroadcastNotif =
  $streamManagerContent.stream_manager_web_broadcast.notifications;

const { LocalStageStream } = window.IVSBroadcastClient;
export const TRACK_READY_STATE = {
  LIVE: 'live',
  ENDED: 'ended'
};

const useStageStrategy = ({ client, isDevicesInitializedRef, updateError }) => {
  const { localParticipant, isStageActive, strategy } = useGlobalStage();
  const { activeDevices } = useBroadcast();
  const activeCameraDevice = activeDevices?.[CAMERA_LAYER_NAME];
  const activeMicrophoneDevice = activeDevices?.[MICROPHONE_AUDIO_INPUT_NAME];
  const prevActiveCameraDevice = usePrevious(activeCameraDevice);
  const prevActiveMicDevice = usePrevious(activeMicrophoneDevice);

  useLocalVideoStream({
    prevActiveCameraDevice,
    activeCameraDevice,
    strategy,
    updateError
  });

  const updateLocalStrategy = useCallback(async () => {
    const micDeviceId = activeMicrophoneDevice?.deviceId;
    const prevCameraDeviceId = prevActiveCameraDevice?.deviceId;
    const prevMicDeviceId = prevActiveMicDevice?.deviceId;

    const isInitializingStreams = !strategy.audioTrack && !strategy.videoTrack;
    const isActiveCamTrackStopped =
      !localParticipant?.isCameraHidden &&
      strategy.videoTrack?.mediaStreamTrack.readyState ===
        TRACK_READY_STATE.ENDED;
    const isActiveMicTrackStopped =
      !localParticipant?.isMicrophoneMuted &&
      strategy.audioTrack?.mediaStreamTrack.readyState ===
        TRACK_READY_STATE.ENDED;
    const isActiveCamDeviceUpdated =
      prevCameraDeviceId !== activeCameraDevice?.deviceId;
    const isActiveMicDeviceUpdated =
      prevMicDeviceId !== activeMicrophoneDevice?.deviceId;

    if (
      (!isInitializingStreams &&
        !isActiveCamTrackStopped &&
        !isActiveMicTrackStopped &&
        !isActiveCamDeviceUpdated &&
        !isActiveMicDeviceUpdated) ||
      !localParticipant?.streams
    )
      return;

    let localAudioStream;
    try {
      localAudioStream = await retryWithExponentialBackoff({
        promiseFn: () =>
          navigator.mediaDevices.getUserMedia({
            audio: { deviceId: micDeviceId }
          }),
        maxRetries: 2
      });
    } catch (error) {
      updateError({
        message: $contentBroadcastNotif.error.failed_to_change_mic,
        err: error
      });
    }

    if (localAudioStream) {
      if (
        strategy.audioTrack?.mediaStreamTrack.readyState ===
        TRACK_READY_STATE.LIVE
      )
        strategy.audioTrack.mediaStreamTrack.stop();

      const localVideoTrack = localParticipant.streams[0];
      const localAudioTrack = new LocalStageStream(
        localAudioStream.getAudioTracks()[0],
        localStreamOptions
      );

      if (localParticipant?.isCameraHidden !== localVideoTrack.isMuted) {
        localVideoTrack.setMuted(
          localParticipant?.isCameraHidden || defaultParticipant.isCameraHidden
        );
      }
      if (localParticipant?.isMicrophoneMuted !== localAudioTrack.isMuted) {
        localAudioTrack.setMuted(
          localParticipant?.isMicrophoneMuted ||
            defaultParticipant.isMicrophoneMuted
        );
      }

      strategy.updateTracks(localAudioTrack, localVideoTrack);
      client?.refreshStrategy(strategy);
    }
  }, [
    activeCameraDevice?.deviceId,
    activeMicrophoneDevice?.deviceId,
    localParticipant?.isCameraHidden,
    localParticipant?.isMicrophoneMuted,
    localParticipant?.streams,
    updateError,
    prevActiveCameraDevice?.deviceId,
    prevActiveMicDevice?.deviceId,
    strategy,
    client
  ]);

  useEffect(() => {
    if (!isDevicesInitializedRef || !isStageActive || !client) return;

    (async function () {
      await updateLocalStrategy();
    })();
  }, [
    client,
    activeCameraDevice,
    activeMicrophoneDevice,
    isStageActive,
    updateLocalStrategy,
    isDevicesInitializedRef
  ]);

  return { strategy, updateLocalStrategy };
};

export default useStageStrategy;
