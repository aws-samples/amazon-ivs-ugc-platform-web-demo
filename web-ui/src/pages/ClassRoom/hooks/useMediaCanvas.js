import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
  useMemo
} from 'react';
import useWebcam from './useWebCam';
import useScreenShare from './useScreenShare';
import useCanvasDrawing from './useDrawingCanvas';

const MediaCanvasContext = createContext(undefined);

const MediaCanvasProvider = ({ children }) => {
  const [isSmall, setIsSmall] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [combinedStream, setCombinedStream] = useState(null);
  const { webcamVideoRef, webcamStream } = useWebcam();
  const { screenShareVideoRef, screenStream, getScreenShare, setScreenStream } =
    useScreenShare(setIsSmall);
  const {
    displayRef,
    whiteboardRef,
    isWhiteBoardActive,
    setIsWhiteBoardActive,
    smallVideoPosition,
    currentDragPosition,
    displayMouseDown,
    displayMouseMove,
    displayMouseUp
  } = useCanvasDrawing(isSmall);

  let ctx1 = displayRef.current ? displayRef.current.getContext('2d') : null;

  useEffect(() => {
    if (!displayRef.current) return;
    const stream = displayRef.current.captureStream(30);
    setCombinedStream(stream);

    return () => {
      [webcamStream, screenStream].forEach((stream) =>
        stream?.getTracks().forEach((track) => track.stop())
      );
    };
  }, []);

  const toggleScreenShare = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
      setIsSmall(false);
    } else {
      getScreenShare();
    }
  }, [screenStream, getScreenShare, setScreenStream, setIsSmall]);

  const toggleWhiteBoard = useCallback(() => {
    setIsWhiteBoardActive((prev) => !prev);
    setIsSmall((prev) => !prev);
  }, []);

  const initilizeAndDrawDisplay = useCallback(
    (dragPosition = null) => {
      if (!ctx1 || !displayRef.current) return;

      const smallWidth = displayRef.current.width * 0.2;
      const smallHeight = displayRef.current.height * 0.2;

      let animationFrameId;

      const draw = () => {
        ctx1.clearRect(
          0,
          0,
          displayRef.current.width,
          displayRef.current.height
        );

        if (isWhiteBoardActive) {
          ctx1.drawImage(whiteboardRef.current, 0, 0);
        } else if (screenStream) {
          ctx1.drawImage(
            screenShareVideoRef.current,
            0,
            0,
            displayRef.current.width,
            displayRef.current.height
          );
        }

        if (webcamStream) {
          const position = dragPosition || smallVideoPosition;
          const x = isSmall ? position.x : 0;
          const y = isSmall ? position.y : 0;
          const width = isSmall ? smallWidth : displayRef.current.width;
          const height = isSmall ? smallHeight : displayRef.current.height;

          if (isVideoMuted) {
            ctx1.fillStyle = 'black';
            ctx1.fillRect(x, y, width, height);
          } else {
            ctx1.drawImage(webcamVideoRef.current, x, y, width, height);
          }
        }

        animationFrameId = requestAnimationFrame(draw);
      };

      animationFrameId = requestAnimationFrame(draw);

      return () => {
        cancelAnimationFrame(animationFrameId);
      };
    },
    [
      isWhiteBoardActive,
      webcamStream,
      screenStream,
      isSmall,
      isVideoMuted,
      smallVideoPosition
    ]
  );

  useEffect(() => {
    initilizeAndDrawDisplay(currentDragPosition);
  }, [currentDragPosition, initilizeAndDrawDisplay]);

  const initilizeWhiteBoard = useCallback(() => {
    const canvas = whiteboardRef.current;
    if (!canvas) return;

    const ctx2 = canvas.getContext('2d');
    if (!ctx2) return;

    ctx2.fillStyle = 'white';
    ctx2.fillRect(0, 0, canvas.width, canvas.height);

    ctx2.strokeStyle = '#000000';
    ctx2.lineWidth = 2;
  }, []);

  useEffect(() => {
    initilizeAndDrawDisplay();
    initilizeWhiteBoard();
  }, [initilizeAndDrawDisplay, initilizeWhiteBoard]);

  const contextValue = useMemo(
    () => ({
      isSmall,
      isWhiteBoardActive,
      setIsWhiteBoardActive,
      displayRef,
      whiteboardRef,
      displayMouseDown,
      displayMouseMove,
      displayMouseUp,
      combinedStream,
      toggleScreenShare,
      toggleWhiteBoard,
      setIsVideoMuted,
      webcamStream,
      webcamVideoRef,
      screenShareVideoRef
    }),
    [
      isSmall,
      isWhiteBoardActive,
      combinedStream,
      displayMouseDown,
      displayMouseMove,
      displayMouseUp,
      toggleScreenShare,
      toggleWhiteBoard,
      webcamStream,
      webcamVideoRef,
      screenShareVideoRef
    ]
  );

  return (
    <MediaCanvasContext.Provider value={contextValue}>
      <>
        <video ref={webcamVideoRef} autoPlay style={{ display: 'none' }} />
        {children}
      </>
    </MediaCanvasContext.Provider>
  );
};

export { MediaCanvasContext, MediaCanvasProvider };

export function useMediaCanvas() {
  const context = useContext(MediaCanvasContext);
  if (context === undefined) {
    throw new Error(
      'useMediaCanvas must be used within an MediaCanvasProvider'
    );
  }
  return context;
}
