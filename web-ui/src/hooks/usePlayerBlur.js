import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const usePlayerBlur = ({
  ingestConfiguration,
  isEnabled = true,
  isLive,
  isLoading,
  videoRef
}) => {
  const canvasRef = useRef();
  const isBlurring = useRef(false);
  const shouldBlurPlayer = useMemo(() => {
    if (ingestConfiguration && isEnabled) {
      const videoWidth = ingestConfiguration.video?.videoWidth;
      const videoHeight = ingestConfiguration.video?.videoHeight;

      if (videoWidth && videoHeight) {
        // If the video ratio isn't 16:9, blur the sides
        return !!(videoHeight / videoWidth !== 0.5625);
      }
    }

    return false;
  }, [ingestConfiguration, isEnabled]);
  const [isBlurReady, setIsBlurReady] = useState(false);

  const startBlur = useCallback(() => {
    if (canvasRef.current && !isBlurring.current) {
      clearCanvas();
      isBlurring.current = true;

      const context = canvasRef.current.getContext('2d');
      context.filter = 'blur(5px)';

      const draw = () => {
        if (canvasRef.current) {
          context.drawImage(
            videoRef.current,
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
          setIsBlurReady(true);

          requestAnimationFrame(draw);
        }
      };

      requestAnimationFrame(draw);
    }
  }, [videoRef]);

  const clearCanvas = () => {
    if (canvasRef.current) {
      const context = canvasRef.current.getContext('2d');

      context.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
    }
  };

  useEffect(() => {
    if (isLive && !isLoading && shouldBlurPlayer) {
      startBlur();

      return () => {
        setIsBlurReady(true);
        clearCanvas();
      };
    }
  }, [isLive, isLoading, shouldBlurPlayer, startBlur]);

  return { shouldBlurPlayer, isBlurReady, canvasRef };
};

export default usePlayerBlur;
