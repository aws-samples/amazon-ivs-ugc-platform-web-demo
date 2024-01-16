import { useRef, useState, useCallback, useEffect } from 'react';
const useCanvasDrawing = (isSmall) => {
  const canvas1Ref = useRef(null);
  const canvas2Ref = useRef(null);
  const canvasVideoRef = useRef(null);
  const [isCanvas2Active, setIsCanvas2Active] = useState(false);
  const [smallVideoPosition, setSmallVideoPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const isDrawing = useRef(false);
  const [lastDrawPosition, setLastDrawPosition] = useState({ x: 0, y: 0 });
  let currentDragPosition = { ...smallVideoPosition };
  const ctx2Ref = useRef(null);
  useEffect(() => {
    if (isCanvas2Active) {
      const canvas = canvas2Ref.current;
      if (canvas) {
        ctx2Ref.current = canvas.getContext('2d');
        canvas.addEventListener('mousedown', handleMouseDownCanvas2);
        canvas.addEventListener('mousemove', handleMouseMoveCanvas2);
        canvas.addEventListener('mouseup', handleMouseUpCanvas2);
        canvas.addEventListener('mouseleave', handleMouseUpCanvas2);
        return () => {
          canvas.removeEventListener('mousedown', handleMouseDownCanvas2);
          canvas.removeEventListener('mousemove', handleMouseMoveCanvas2);
          canvas.removeEventListener('mouseup', handleMouseUpCanvas2);
          canvas.removeEventListener('mouseleave', handleMouseUpCanvas2);
        };
      }
    }
  }, [isCanvas2Active]);

  useEffect(() => {
    const canvas = canvas2Ref.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');

     
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      ctx.scale(dpr, dpr);
    }
  }, []); 

  const handleMouseDownCanvas1 = useCallback(
    (e) => {
      if (isSmall) {
        const rect = canvas1Ref.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const smallWidth = canvas1Ref.current.width * 0.2;
        const smallHeight = canvas1Ref.current.height * 0.2;

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
    [isSmall, canvas1Ref, smallVideoPosition]
  );

  const handleMouseMoveCanvas1 = useCallback(
    (e) => {
      if (isSmall && isDragging) {
        const rect = canvas1Ref.current.getBoundingClientRect();
        const newX = e.clientX - rect.left - dragStart.x;
        const newY = e.clientY - rect.top - dragStart.y;

      
        const boundedX = Math.max(
          0,
          Math.min(
            canvas1Ref.current.width - canvas1Ref.current.width * 0.2,
            newX
          )
        );
        const boundedY = Math.max(
          0,
          Math.min(
            canvas1Ref.current.height - canvas1Ref.current.height * 0.2,
            newY
          )
        );
        currentDragPosition = { x: boundedX, y: boundedY };
        setSmallVideoPosition(currentDragPosition);
      }
    },
    [isSmall, isDragging, canvas1Ref, dragStart]
  );

  const handleMouseUpCanvas1 = useCallback(() => {
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

  const handleMouseDownCanvas2 = useCallback((e) => {
    isDrawing.current = true;
    const mousePos = getMousePos(canvas2Ref.current, e);

    if (!ctx2Ref.current) return;

    ctx2Ref.current.beginPath(); 
    ctx2Ref.current.moveTo(mousePos.x, mousePos.y); 

    setLastDrawPosition({ x: mousePos.x, y: mousePos.y });
  }, []);

  const handleMouseMoveCanvas2 = useCallback(
    (e) => {
      if (!isDrawing.current || !ctx2Ref.current) return;

      const mousePos = getMousePos(canvas2Ref.current, e);

      ctx2Ref.current.lineTo(mousePos.x, mousePos.y); 
      ctx2Ref.current.stroke();

      setLastDrawPosition({ x: mousePos.x, y: mousePos.y }); 
    },
    [lastDrawPosition]
  );

  const handleMouseUpCanvas2 = useCallback(() => {
    isDrawing.current = false;
  }, []);

  return {
    canvas1Ref,
    canvas2Ref,
    canvasVideoRef,
    isCanvas2Active,
    setIsCanvas2Active,
    smallVideoPosition,
    setSmallVideoPosition,
    handleMouseDownCanvas1,
    handleMouseMoveCanvas1,
    handleMouseUpCanvas1,
    currentDragPosition
  };
};

export default useCanvasDrawing;
