import { useCallback, useEffect, useRef, useState } from 'react';

import { CAMERA_LAYER_NAME } from '../useLayers';
import { captureScreenShareStream } from './utils';
import { streamManager as $streamManagerContent } from '../../../content';
import useLatest from '../../../hooks/useLatest';
import useStateWithCallback from '../../../hooks/useStateWithCallback';

const $content = $streamManagerContent.stream_manager_web_broadcast;

const SCREEN_SHARE_ID = 'screen-share';
const SCREEN_SHARE_VIDEO_LAYER_NAME = `${SCREEN_SHARE_ID}-layer`;
const SCREEN_SHARE_AUDIO_INPUT_NAME = `${SCREEN_SHARE_ID}-audio-input`;

const CAMERA_SIZE_DIVISOR = 4;
const CAMERA_LAYER_PADDING = 20;

const useScreenShare = ({
  addScreenShareAudioInput,
  addScreenShareLayer,
  removeAudioInput,
  removeLayer,
  updateLayerGroup,
  setError
}) => {
  const [screenCaptureStream, setScreenCaptureStream] = useState(null);
  const [shouldShowCameraOnScreenShare, setShouldShowCameraOnScreenShare] =
    useStateWithCallback(true);
  const isScreenSharePromptOpen = useRef(false);
  const isScreenSharing = useLatest(!!screenCaptureStream);
  const screenCaptureStreamTracks = useLatest(
    screenCaptureStream?.getTracks() || []
  );

  const updateCameraLayerGroupComposition = useCallback(
    (shouldShowCamera) =>
      updateLayerGroup(
        CAMERA_LAYER_NAME,
        ({ width: canvasWidth, height: canvasHeight }) => ({
          width: shouldShowCamera ? canvasWidth / CAMERA_SIZE_DIVISOR : 0,
          height: shouldShowCamera ? canvasHeight / CAMERA_SIZE_DIVISOR : 0,
          x:
            canvasWidth -
            canvasWidth / CAMERA_SIZE_DIVISOR -
            CAMERA_LAYER_PADDING,
          y: CAMERA_LAYER_PADDING
        })
      ),
    [updateLayerGroup]
  );

  const stopScreenShare = useCallback(() => {
    if (!isScreenSharing.current) return;

    // Stop and close the media tracks bound to the shared screen
    for (const track of screenCaptureStreamTracks.current) track.stop();

    updateLayerGroup(CAMERA_LAYER_NAME, {});
    removeLayer(SCREEN_SHARE_VIDEO_LAYER_NAME);
    removeAudioInput(SCREEN_SHARE_AUDIO_INPUT_NAME);
    setScreenCaptureStream(null);
  }, [
    isScreenSharing,
    removeAudioInput,
    removeLayer,
    screenCaptureStreamTracks,
    updateLayerGroup
  ]);

  const startScreenShare = useCallback(async () => {
    if (isScreenSharePromptOpen.current) return;

    if (isScreenSharing.current) stopScreenShare();

    let stream, error;
    try {
      try {
        isScreenSharePromptOpen.current = true;
        stream = await captureScreenShareStream();
      } catch (err) {
        console.error(err);
        error = err;
      } finally {
        isScreenSharePromptOpen.current = false;

        if (!stream) {
          if (error.message === 'Permission denied') {
            // Chrome: the user cancelled the screen share request from the window prompt.
            // Permissions were not explicitly denied, so we return without setting an error.
            return;
          }

          setError({
            message:
              $content.notifications.error.screenshare_permissions_denied,
            err: error
          });

          return;
        }
      }

      const [videoTrack] = stream.getVideoTracks();
      const [audioTrack] = stream.getAudioTracks();
      const screenSharePromises = [];

      if (videoTrack) {
        screenSharePromises.push(
          addScreenShareLayer(SCREEN_SHARE_VIDEO_LAYER_NAME, {
            stream,
            position: { index: 0 }
          })
        );
      }
      if (audioTrack) {
        screenSharePromises.push(
          addScreenShareAudioInput(SCREEN_SHARE_AUDIO_INPUT_NAME, {
            stream,
            muted: audioTrack.muted
          })
        );
      }

      await Promise.all(screenSharePromises);
      updateCameraLayerGroupComposition(shouldShowCameraOnScreenShare);
      setScreenCaptureStream(stream);
    } catch (error) {
      console.error('Failed to start screen share', error);

      const tracks = stream?.getTracks() || [];
      for (const track of tracks) track.stop();
    }
  }, [
    addScreenShareAudioInput,
    addScreenShareLayer,
    isScreenSharing,
    setError,
    shouldShowCameraOnScreenShare,
    stopScreenShare,
    updateCameraLayerGroupComposition
  ]);

  const toggleScreenShare = useCallback(
    ({ shouldScreenShare } = {}) => {
      const isScreenSharingNext = shouldScreenShare ?? !isScreenSharing.current;

      if (isScreenSharingNext) startScreenShare();
      else stopScreenShare();
    },
    [isScreenSharing, startScreenShare, stopScreenShare]
  );

  const updateShouldShowCameraOnScreenShare = useCallback(
    (nextShouldShowCameraOnScreenShare) => {
      if (nextShouldShowCameraOnScreenShare == null) return;

      setShouldShowCameraOnScreenShare(
        nextShouldShowCameraOnScreenShare,
        (_, shouldShowCamera) => {
          if (isScreenSharing.current)
            updateCameraLayerGroupComposition(shouldShowCamera);
        }
      );
    },
    [
      isScreenSharing,
      setShouldShowCameraOnScreenShare,
      updateCameraLayerGroupComposition
    ]
  );

  useEffect(() => {
    const [screenCaptureTrack] = screenCaptureStream?.getVideoTracks() || [];

    if (screenCaptureTrack)
      screenCaptureTrack.addEventListener('ended', stopScreenShare);

    return () => {
      if (screenCaptureTrack)
        screenCaptureTrack.removeEventListener('ended', stopScreenShare);
    };
  }, [screenCaptureStream, stopScreenShare]);

  return {
    isScreenSharing: isScreenSharing.current,
    shouldShowCameraOnScreenShare,
    toggleScreenShare,
    stopScreenShare,
    updateShouldShowCameraOnScreenShare
  };
};

export default useScreenShare;
