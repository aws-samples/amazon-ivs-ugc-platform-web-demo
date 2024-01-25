import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import useCanvasDrawing from './useDrawingCanvas';
import useScreenShare from './useScreenShare';
import useVirtualBackground from './useVirtualBackground';
import useWebcam from './useWebCam';

// https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
// https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
// https://plus.unsplash.com/premium_photo-1677474827615-31ea6fa13efe?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
const Image1 =
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

const MediaCanvasContext = createContext(undefined);

const MediaCanvasProvider = ({ children }) => {
  const [isSmall, setIsSmall] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [combinedStream, setCombinedStream] = useState(null);
  const { webcamVideoRef, webcamStream } = useWebcam();
  const {
    screenShareVideoRef,
    screenStream,
    getScreenShare,
    setScreenStream,
    isScreenShareActive,
    setIsScreenShareActive
  } = useScreenShare(setIsSmall);
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
  // const {
  //   toggleVirtualBackground,
  //   virtualBackgroundRef,
  //   isVirtualBackgroundActive,
  //   virtualBgStream
  // } = useVirtualBackground(Image1, webcamStream);

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
        } else if (isScreenShareActive) {
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
            ctx1.clearRect(0, 0, ctx1.width, ctx1.height);
            ctx1.font = '40px Arial';
            ctx1.fillStyle = 'black';
            ctx1.textAlign = 'center';
            ctx1.textBaseline = 'middle';
            const x = width / 2;
            const y = height / 2;
            ctx1.fillText('Camera Off', x, y);
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
      smallVideoPosition,
      // virtualBgStream
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
      isScreenShareActive,
      setIsWhiteBoardActive,
      displayRef,
      whiteboardRef,
      displayMouseDown,
      displayMouseMove,
      displayMouseUp,
      combinedStream,
      toggleScreenShare,
      toggleWhiteBoard,
      isVideoMuted,
      setIsVideoMuted,
      webcamVideoRef,
      screenShareVideoRef,
      // toggleVirtualBackground,
      // virtualBackgroundRef,
      webcamStream,
      // isVirtualBackgroundActive
    }),
    [
      isSmall,
      isWhiteBoardActive,
      isScreenShareActive,
      combinedStream,
      displayMouseDown,
      displayMouseMove,
      displayMouseUp,
      toggleScreenShare,
      toggleWhiteBoard,
      webcamVideoRef,
      screenShareVideoRef,
      isVideoMuted,
      // toggleVirtualBackground,
      // virtualBackgroundRef,
      // isVirtualBackgroundActive,
      webcamStream
    ]
  );

  return (
    <MediaCanvasContext.Provider value={contextValue}>
      <>
      <video ref={webcamVideoRef} autoPlay style={{ display: 'none' }}>
        <track kind="captions" />
      </video> {/* <canvas
          ref={virtualBackgroundRef}
          width={1280}
          height={720}
          style={{
            display: 'none'
          }}
        /> */}
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
