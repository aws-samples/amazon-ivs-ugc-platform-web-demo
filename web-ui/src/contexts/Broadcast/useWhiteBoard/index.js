import { useCallback, useEffect,  useState } from 'react';
import { CAMERA_LAYER_NAME } from '../useLayers';
import useLatest from '../../../hooks/useLatest';
import useStateWithCallback from '../../../hooks/useStateWithCallback';
import html2canvas from 'html2canvas';
import { jsPDF } from "jspdf";

const WHITEBOARD_ID = 'screen-share';
const WHITEBOARD_VIDEO_LAYER_NAME = `${WHITEBOARD_ID}-layer`;
const WHITEBOARD_AUDIO_INPUT_NAME = `${WHITEBOARD_ID}-audio-input`;

const CAMERA_SIZE_DIVISOR = 4;
const CAMERA_LAYER_PADDING = 20;

const useWhiteBoard = ({
  addScreenShareLayer,
  removeAudioInput,
  removeLayer,
  updateLayerGroup,
  canvasRef
}) => {
  const [screenCaptureStream, setScreenCaptureStream] = useState(null);
  const [shouldShowCameraOnScreenShare, setShouldShowCameraOnScreenShare] =
    useStateWithCallback(true);
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

  const stopWhiteBoard = useCallback(() => {
    if (!isScreenSharing.current) return;

    // Stop and close the media tracks bound to the shared screen
    for (const track of screenCaptureStreamTracks.current) track.stop();

    updateLayerGroup(CAMERA_LAYER_NAME, {});
    removeLayer(WHITEBOARD_VIDEO_LAYER_NAME);
    removeAudioInput(WHITEBOARD_AUDIO_INPUT_NAME);
    setScreenCaptureStream(null);
  }, [
    isScreenSharing,
    removeAudioInput,
    removeLayer,
    screenCaptureStreamTracks,
    updateLayerGroup
  ]);

  const startWhiteBoard = useCallback(async () => {
    let stream;
  
    try {
      // Checking the canvas is ready and has content
      if (!canvasRef.current) {
        console.error("Canvas reference is not available.");
        return;
      }
  
      // Capturing the stream from the canvas
      stream = canvasRef.current.captureStream();
  
  
      if (stream.getVideoTracks().length === 0) {
        console.error("No video tracks found in the stream.");
        return;
      }
  
      console.log(stream.getVideoTracks());
  
      // Processing the stream for screen sharing
      const screenSharePromises = [];
  
      screenSharePromises.push(
        addScreenShareLayer(WHITEBOARD_VIDEO_LAYER_NAME, {
          stream,
          position: { index: 0 }
        })
      );
  
      await Promise.all(screenSharePromises);
      updateCameraLayerGroupComposition(shouldShowCameraOnScreenShare);
      setScreenCaptureStream(stream);
    } catch (error) {
      console.error('Failed to start whiteboard share', error);
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
  

  const toggleWhiteBoard = useCallback(
    ({ shouldScreenShare } = {}) => {
      console.log('HEre')
      const isScreenSharingNext = shouldScreenShare ?? !isScreenSharing.current;

      if (isScreenSharingNext) startWhiteBoard();
      else stopWhiteBoard();
    },
    [isScreenSharing, startWhiteBoard, stopWhiteBoard]
  );

  const downloadCanvasPDF = () => {
    const element = canvasRef.current;
    const pdf = new jsPDF("portrait", "px", [380, 380]);

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    html2canvas(element, {
      scale: 5,
    }).then(function (canvas) {
      var data = canvas.toDataURL("image/png");
      // const pdf = new jsPDF();
      // const imgProperties = pdf.getImageProperties(data);
      // const pdfWidth = pdf.internal.pageSize.getWidth();
      // const pdfHeight =
      //   (imgProperties.height * pdfWidth) / imgProperties.width;

      pdf.addImage(data, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("whiteboard.pdf");
    });
  }

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
      screenCaptureTrack.addEventListener('ended', stopWhiteBoard);

    return () => {
      if (screenCaptureTrack)
        screenCaptureTrack.removeEventListener('ended', stopWhiteBoard);
    };
  }, [screenCaptureStream, stopWhiteBoard]);

  return {
    isScreenSharing: isScreenSharing.current,
    shouldShowCameraOnScreenShare,
    toggleWhiteBoard,
    stopWhiteBoard,
    updateShouldShowCameraOnScreenShare,
    downloadCanvasPDF
  };
};

export default useWhiteBoard;
