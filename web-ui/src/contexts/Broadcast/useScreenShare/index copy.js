import { useCallback, useEffect,  useState } from 'react';

import { CAMERA_LAYER_NAME } from '../useLayers';
// import { captureScreenShareStream } from './utils';
// import { streamManager as $streamManagerContent } from '../../../content';
import useLatest from '../../../hooks/useLatest';
import useStateWithCallback from '../../../hooks/useStateWithCallback';


// const $content = $streamManagerContent.stream_manager_web_broadcast;

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
  setError,
  canvasRef
}) => {
  const [screenCaptureStream, setScreenCaptureStream] = useState(null);
  const [shouldShowCameraOnScreenShare, setShouldShowCameraOnScreenShare] =
    useStateWithCallback(true);
  const isScreenSharing = useLatest(!!screenCaptureStream);
  const screenCaptureStreamTracks = useLatest(
    screenCaptureStream?.getTracks() || []
  );
 
console.log('canvasRef Share',canvasRef)
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
    let stream;
  
    try {
      // Ensure the canvas is ready and has content
      if (!canvasRef.current) {
        console.error("Canvas reference is not available.");
        return;
      }
  
      // Capture the stream from the canvas
      stream = canvasRef.current.captureStream(60); // 60 FPS
      console.log('Captured stream:', stream);
  
      if (stream.getVideoTracks().length === 0) {
        console.error("No video tracks found in the stream.");
        return;
      }
  
      console.log(stream.getVideoTracks());

      const combinedStream = new MediaStream([...stream.getVideoTracks()]);
  
      // Processing the stream for screen sharing
      const screenSharePromises = [];
  
      screenSharePromises.push(
        addScreenShareLayer(SCREEN_SHARE_VIDEO_LAYER_NAME, {
          combinedStream,
          position: { index: 0 }
        })
      );
  
      // Audio track handling (if necessary)
      // const [audioTrack] = combinedStream.getAudioTracks();
      // if (audioTrack) {
      //   screenSharePromises.push(
      //     addScreenShareAudioInput(SCREEN_SHARE_AUDIO_INPUT_NAME, {
      //       combinedStream,
      //       muted: audioTrack.muted
      //     })
      //   );
      // }
  
      await Promise.all(screenSharePromises);
      updateCameraLayerGroupComposition(shouldShowCameraOnScreenShare);
      setScreenCaptureStream(combinedStream);
    } catch (error) {
      console.error('Failed to start screen share', error);
      // Stop any ongoing tracks in case of failure
      stream?.getTracks().forEach(track => track.stop());
    }
  }, [
    addScreenShareLayer,
    shouldShowCameraOnScreenShare,
    updateCameraLayerGroupComposition,
    setScreenCaptureStream,
    canvasRef
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
