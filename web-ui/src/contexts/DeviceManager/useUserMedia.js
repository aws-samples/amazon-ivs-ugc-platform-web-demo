import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  getUserMedia,
  stopMediaStream,
  updateMediaStreamTracks
} from './helpers';
import useLocalDevices from './useLocalDevices';
import useLayers, { VIDEO_LAYER_NAME } from '../Broadcast/useLayers';
import useAudioMixer, { AUDIO_INPUT_NAME } from '../Broadcast/useAudioMixer';
import {
  createBackgroundLayerPreset,
  createNoCameraLayerPreset
} from '../Broadcast/useLayers/presetLayers';
import useScreenShare from '../Broadcast/useScreenShare';
import { noop } from './utils';

let mediaStream = new MediaStream();

/**
 * Creates and manages a single user media stream
 */
function useUserMedia() {
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoStopped, setVideoStopped] = useState(false);
  const [shouldUpdateStreamsToPublish, setShouldUpdateStreamsToPublish] =
    useState(false);

  /**
   * Broadcast Audio inputs
   */
  const {
    addMicAudioInput,
    addScreenShareAudioInput,
    toggleMute,
    removeAudioInput,
    isAudioInputMuted
  } = useAudioMixer();

  const toggleAudio = useCallback(
    (options = {}) => {
      const mediaStreamAudioTrack = mediaStream.getAudioTracks()[0];
      if (mediaStreamAudioTrack) {
        const nextAudioMuted = options.muted ?? mediaStreamAudioTrack.enabled;
        setAudioMuted(nextAudioMuted);

        // Update Broadcast Audio Mixer mute state
        if (options.isBroadcast) {
          toggleMute(AUDIO_INPUT_NAME, { shouldMute: nextAudioMuted });
        }

        /**
         * If the local participant is not yet publishing, then no audio LocalStageStream instances will be available.
         * As a result, since there is no link yet between the Stage and the local audio MediaStream track, attempting
         * to mute the track by calling the setMuted method on the LocalStageStream class will have no effect. Therefore,
         * we must ensure that the `enabled` property on the local audio MediaStream track reflects the correct muted state
         * before the local participant starts publishing. Once the local participant starts publishing, this state will be
         * picked up by the Stage strategy to instantiate the audio LocalStageStream instance with the expected muted state.
         */
        if (options.muted === undefined) {
          mediaStreamAudioTrack.enabled = !nextAudioMuted;
        }
      }
    },
    [toggleMute]
  );

  /**
   * Broadcast Layers
   */
  const {
    addVideoLayer,
    addScreenShareLayer,
    addImageLayer,
    toggleLayer,
    updateLayerGroup,
    removeLayer,
    isLayerHidden
  } = useLayers();
  const presetLayers = useMemo(() => {
    const handlers = { addImageLayer, removeLayer };

    return {
      noCamera: createNoCameraLayerPreset(handlers),
      background: createBackgroundLayerPreset(handlers)
    };
  }, [addImageLayer, removeLayer]);

  const toggleVideo = useCallback(
    (options = {}) => {
      const mediaStreamVideoTrack = mediaStream.getVideoTracks()[0];
      if (mediaStreamVideoTrack) {
        const nextVideoStopped =
          options.stopped ?? mediaStreamVideoTrack.enabled;
        setVideoStopped(nextVideoStopped);

        // Update Broadcast Video Layers state
        if (options.isBroadcast) {
          let isHidden = toggleLayer(VIDEO_LAYER_NAME, options);

          if (isHidden !== nextVideoStopped) {
            isHidden = toggleLayer(VIDEO_LAYER_NAME, options);
          }
          if (isHidden) presetLayers.noCamera.add();
          else presetLayers.noCamera.remove();
        }

        /**
         * If the local participant is not yet publishing, then no video LocalStageStream instances will be available.
         * As a result, since there is no link yet between the Stage and the local video MediaStream track, attempting
         * to mute the track by calling the setMuted method on the LocalStageStream class will have no effect. Therefore,
         * we must ensure that the `enabled` property on the local video MediaStream track reflects the correct muted state
         * before the local participant starts publishing. Once the local participant starts publishing, this state will be
         * picked up by the Stage strategy to instantiate the video LocalStageStream instance with the expected muted state.
         */
        if (options.stopped === undefined) {
          mediaStreamVideoTrack.enabled = !nextVideoStopped;
        }
      }
    },
    [presetLayers.noCamera, toggleLayer]
  );

  /**
   * Screen share
   */
  const {
    isScreenSharing,
    shouldShowCameraOnScreenShare,
    stopScreenShare,
    toggleScreenShare,
    updateShouldShowCameraOnScreenShare
  } = useScreenShare({
    addScreenShareAudioInput,
    addScreenShareLayer,
    removeAudioInput,
    removeLayer,
    updateLayerGroup,
    setError: noop
  });

  /**
   * Devices
   */
  const {
    devices,
    activeDevices,
    userMediaError,
    startLocalDevices,
    updateActiveDevice,
    permissions,
    detectDevicePermissions
  } = useLocalDevices({
    toggleAudio,
    toggleVideo,
    addVideoLayer,
    addMicAudioInput,
    presetLayers,
    removeLayer,
    removeAudioInput
  });

  const updateMediaStream = useCallback(async (deviceIds) => {
    let newMediaStream;

    try {
      newMediaStream = await getUserMedia(deviceIds);
    } catch (error) {
      console.error(error);

      return;
    }

    if (newMediaStream) {
      const newTracks = newMediaStream?.getTracks();
      updateMediaStreamTracks(mediaStream, newTracks);
      setShouldUpdateStreamsToPublish(true);
    }

    return mediaStream;
  }, []);

  const startUserMedia = useCallback(async () => {
    const activeDeviceInfo = await startLocalDevices();

    return updateMediaStream({
      audioDeviceId: activeDeviceInfo.audio?.deviceId,
      videoDeviceId: activeDeviceInfo.video?.deviceId
    });
  }, [startLocalDevices, updateMediaStream]);

  const stopUserMedia = useCallback(() => {
    stopMediaStream(mediaStream);
    setAudioMuted(false);
    setVideoStopped(false);
    mediaStream = new MediaStream();
  }, []);

  useEffect(() => {
    const audioDeviceId = activeDevices.audio?.deviceId;
    const videoDeviceId = activeDevices.video?.deviceId;

    // We only want to process changes made to existing mediaStream tracks
    if (mediaStream.getTracks().length) {
      updateMediaStream({ audioDeviceId, videoDeviceId });
    }
  }, [
    activeDevices.audio?.deviceId,
    activeDevices.video?.deviceId,
    updateMediaStream
  ]);

  useEffect(() => stopUserMedia, [stopUserMedia]);

  return useMemo(
    () => ({
      activeDevices,
      audioMuted,
      devices,
      startUserMedia,
      mediaStream,
      stopUserMedia,
      toggleAudio,
      toggleVideo,
      updateActiveDevice,
      userMediaError,
      videoStopped,
      permissions,
      shouldUpdateStreamsToPublish,
      setShouldUpdateStreamsToPublish,
      broadcast: {
        toggleLayer,
        isLayerHidden,
        toggleMute,
        isAudioInputMuted,
        isScreenSharing,
        shouldShowCameraOnScreenShare,
        stopScreenShare,
        toggleScreenShare,
        updateShouldShowCameraOnScreenShare,
        presetLayers,
        addVideoLayer,
        addMicAudioInput,
        detectDevicePermissions
      }
    }),
    [
      activeDevices,
      audioMuted,
      devices,
      startUserMedia,
      stopUserMedia,
      toggleAudio,
      toggleVideo,
      updateActiveDevice,
      userMediaError,
      videoStopped,
      permissions,
      shouldUpdateStreamsToPublish,
      toggleLayer,
      isLayerHidden,
      toggleMute,
      isAudioInputMuted,
      isScreenSharing,
      shouldShowCameraOnScreenShare,
      stopScreenShare,
      toggleScreenShare,
      updateShouldShowCameraOnScreenShare,
      presetLayers,
      addVideoLayer,
      addMicAudioInput,
      detectDevicePermissions
    ]
  );
}

export default useUserMedia;
