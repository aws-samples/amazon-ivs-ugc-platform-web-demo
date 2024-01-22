import { useRef, useState, useCallback, useEffect } from 'react';
const useCanvasDrawing = (isSmall) => {
  const displayRef = useRef(null);
  const whiteboardRef = useRef(null);
  const [isWhiteBoardActive, setIsWhiteBoardActive] = useState(false);
  const [smallVideoPosition, setSmallVideoPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const isDrawing = useRef(false);
  const [lastDrawPosition, setLastDrawPosition] = useState({ x: 0, y: 0 });
  let currentDragPosition = { ...smallVideoPosition };
  const ctx2Ref = useRef(null);
  useEffect(() => {
    if (isWhiteBoardActive) {
      const canvas = whiteboardRef.current;
      if (canvas) {
        ctx2Ref.current = canvas.getContext('2d');
        canvas.addEventListener('mousedown', whiteBoardMouseDown);
        canvas.addEventListener('mousemove', whiteBoardMouseMove);
        canvas.addEventListener('mouseup', whiteBoardMouseUp);
        canvas.addEventListener('mouseleave', whiteBoardMouseUp);
        return () => {
          canvas.removeEventListener('mousedown', whiteBoardMouseDown);
          canvas.removeEventListener('mousemove', whiteBoardMouseMove);
          canvas.removeEventListener('mouseup', whiteBoardMouseUp);
          canvas.removeEventListener('mouseleave', whiteBoardMouseUp);
        };
      }
    }
  }, [isWhiteBoardActive]);

  useEffect(() => {
    const canvas = whiteboardRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      // ctx.scale(dpr, dpr); // If whiteboard is placed in small place then uncomment this.
    }
  }, []);

  const displayMouseDown = useCallback(
    (e) => {
      if (isSmall) {
        const rect = displayRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const smallWidth = displayRef.current.width * 0.2;
        const smallHeight = displayRef.current.height * 0.2;

        if (
          x >= smallVideoPosition.x &&
          x <= smallVideoPosition.x + smallWidth &&
          y >= smallVideoPosition.y &&
          y <= smallVideoPosition.y + smallHeight
        ) {
          setIsDragging(true);
          setDragStart({
            x: x - smallVideoPosition.x,
            y: y - smallVideoPosition.y
          });
          currentDragPosition = { ...smallVideoPosition };
        }
      }
    },
    [isSmall, displayRef, smallVideoPosition]
  );

  const displayMouseMove = useCallback(
    (e) => {
      if (isSmall && isDragging) {
        const rect = displayRef.current.getBoundingClientRect();
        const newX = e.clientX - rect.left - dragStart.x;
        const newY = e.clientY - rect.top - dragStart.y;

        const boundedX = Math.max(
          0,
          Math.min(
            displayRef.current.width - displayRef.current.width * 0.2,
            newX
          )
        );
        const boundedY = Math.max(
          0,
          Math.min(
            displayRef.current.height - displayRef.current.height * 0.2,
            newY
          )
        );
        currentDragPosition = { x: boundedX, y: boundedY };
        setSmallVideoPosition(currentDragPosition);
      }
    },
    [isSmall, isDragging, displayRef, dragStart]
  );

  const displayMouseUp = useCallback(() => {
    setIsDragging(false);
    setSmallVideoPosition(currentDragPosition);
  }, [currentDragPosition]);

  const getMousePos = (canvas, evt) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (evt.clientX - rect.left) * scaleX,
      y: (evt.clientY - rect.top) * scaleY
    };
  };

  const whiteBoardMouseDown = useCallback((e) => {
    isDrawing.current = true;
    const mousePos = getMousePos(whiteboardRef.current, e);

    if (!ctx2Ref.current) return;

    ctx2Ref.current.beginPath();
    ctx2Ref.current.moveTo(mousePos.x, mousePos.y);

    setLastDrawPosition({ x: mousePos.x, y: mousePos.y });
  }, []);

  const whiteBoardMouseMove = useCallback(
    (e) => {
      if (!isDrawing.current || !ctx2Ref.current) return;

      const mousePos = getMousePos(whiteboardRef.current, e);

      ctx2Ref.current.lineTo(mousePos.x, mousePos.y);
      ctx2Ref.current.stroke();

      setLastDrawPosition({ x: mousePos.x, y: mousePos.y });
    },
    [lastDrawPosition]
  );

  const whiteBoardMouseUp = useCallback(() => {
    isDrawing.current = false;
  }, []);

  return {
    displayRef,
    whiteboardRef,
    isWhiteBoardActive,
    setIsWhiteBoardActive,
    smallVideoPosition,
    setSmallVideoPosition,
    displayMouseDown,
    displayMouseMove,
    displayMouseUp,
    currentDragPosition
  };
};

export default useCanvasDrawing;
