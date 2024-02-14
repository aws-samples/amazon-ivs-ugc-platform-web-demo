import { useRef, useState, useEffect, useCallback } from 'react';
import { SelfieSegmentation } from '@mediapipe/selfie_segmentation';
const Image1 =
  'https://www.wework.com/ideas/wp-content/uploads/sites/4/2020/04/WeWork_CommonArea_Kitchen-scaled.jpg';
const useVirtualBackground = (videoStream) => {
  const [isVirtualBgActive, setIsVirtualBgActive] = useState(false);
  const [activeVirtualBg, setActiveVirtualBg] = useState(Image1);
  const [virtualBgMode, setVirtualBgMode] = useState('blur');
  const virtualBgRef = useRef(null);
  const contextRef = useRef(null);
  const backgroundImageRef = useRef(null);
  const canvasStreamRef = useRef(null);
  const selfieSegmentationRef = useRef(
    new SelfieSegmentation({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
    })
  );

  const onResults = useCallback(
    (results) => {
      const canvas = virtualBgRef.current;
      const context = contextRef.current;
      if (!canvas || !context) return;

      context.clearRect(0, 0, canvas.width, canvas.height);

      if (isVirtualBgActive) {
        context.drawImage(
          results.segmentationMask,
          0,
          0,
          canvas.width,
          canvas.height
        );
        context.globalCompositeOperation = 'source-out';
        if (virtualBgMode === 'image') {
          context.drawImage(
            backgroundImageRef.current,
            0,
            0,
            canvas.width,
            canvas.height
          );
        } else if (virtualBgMode === 'blur') {
          context.filter = 'blur(10px)';
          context.drawImage(results.image, 0, 0, canvas.width, canvas.height);
          context.filter = 'none';
        }
        context.globalCompositeOperation = 'destination-atop';
      }

      context.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    },
    [isVirtualBgActive, virtualBgMode]
  );

  useEffect(() => {
    if (!videoStream) {
      return;
    }

    const videoElement = document.createElement('video');
    videoElement.srcObject = videoStream;
    videoElement.play();

    const sendToMediaPipe = async () => {
      if (videoElement.readyState >= 2) {
        await selfieSegmentationRef.current.send({ image: videoElement });
      }
      requestAnimationFrame(sendToMediaPipe);
    };

    backgroundImageRef.current = new Image();
    backgroundImageRef.current.crossOrigin = 'anonymous';
    backgroundImageRef.current.src = activeVirtualBg;
    backgroundImageRef.current.onload = () => {
      selfieSegmentationRef.current.setOptions({
        modelSelection: 1,
        selfieMode: true
      });
      selfieSegmentationRef.current.onResults(onResults);
      sendToMediaPipe();
    };

    contextRef.current = virtualBgRef.current.getContext('2d');

    canvasStreamRef.current = virtualBgRef.current.captureStream(30);

    return () => {
      videoElement.pause();
      videoElement.srcObject = null;
    };
  }, [activeVirtualBg, videoStream, onResults]);

  const toggleBackground = useCallback(
    (active, bgUrl, bgMode) => {
      setIsVirtualBgActive(active);
      setActiveVirtualBg(bgUrl || Image1);
      setVirtualBgMode(bgMode);
    },
    [isVirtualBgActive, activeVirtualBg, virtualBgMode]
  );

  return {
    toggleBackground,
    isVirtualBgActive,
    virtualBgRef,
    virtualBgStream: canvasStreamRef.current,
    activeVirtualBg,
    virtualBgMode
  };
};

export default useVirtualBackground;
