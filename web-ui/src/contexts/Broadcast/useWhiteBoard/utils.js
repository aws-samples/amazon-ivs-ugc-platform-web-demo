import { useRef, useCallback, useState } from 'react';

export const useCanvasDrawing = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isCanvasInitialized, setIsCanvasInitialized] = useState(false);
  

  const startDrawing = useCallback(({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  }, []);

  const draw = useCallback(
    ({ nativeEvent }) => {
      if (!isDrawing) return;
      const { offsetX, offsetY } = nativeEvent;
      const ctx = canvasRef.current.getContext('2d');
      ctx.strokeStyle = 'black'; // Set the stroke color to white
      ctx.lineTo(offsetX, offsetY);
      ctx.stroke();
    },
    [isDrawing]
  );

  const endDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  // Initialize canvas with a white background
  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      setIsCanvasInitialized(true); // Set the canvas as initialized

      canvas.width = 800;
      canvas.height = 600;
      const context = canvas.getContext('2d');
      context.fillStyle = '#808080';
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  return {
    canvasRef,
    startDrawing,
    draw,
    endDrawing,
    initializeCanvas,
    isCanvasInitialized
  };
};
