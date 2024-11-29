import { clsm } from '../../../../utils';
import { useEffect, useRef } from 'react';
import { useBroadcast } from '../../../../contexts/Broadcast';
import { useSelector } from 'react-redux';

/**
 * This component renders a canvas element that displays the preview video for an Amazon IVS web broadcast.
 * It uses a ref to manage the canvas and resets the preview when necessary.
 * This component is used in the GoLiveContainer component when in low-latency mode.
 *
 * @returns {JSX.Element} A canvas element for the preview video.
 */

const PreviewVideo = () => {
  const {
    fullscreen: { isOpen: isFullscreenOpen },
    goLiveContainer: { isOpen: isGoLiveContainerOpen }
  } = useSelector((state) => state.streamManager);
  const canvasRef = useRef();
  const { setupVideoPreview } = useBroadcast();

  useEffect(() => {
    if (isFullscreenOpen || !isGoLiveContainerOpen || !canvasRef) return;

    setupVideoPreview(canvasRef);
  }, [setupVideoPreview, isFullscreenOpen, canvasRef, isGoLiveContainerOpen]);

  return (
    <canvas
      ref={canvasRef}
      className={clsm(['aspect-video', 'rounded-xl', 'w-full'])}
      aria-label="Amazon IVS low latency web broadcast video and audio preview"
    />
  );
};

export default PreviewVideo;
