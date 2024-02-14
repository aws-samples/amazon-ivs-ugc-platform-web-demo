import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef
} from 'react';
import useCanvasDrawing from './useDrawingCanvas';
import useScreenShare from './useScreenShare';
import useVirtualBackground from './useVirtualBackground';
import useWebcam from './useWebCam';

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
  const {
    toggleBackground,
    virtualBgRef,

    virtualBgStream
  } = useVirtualBackground(webcamStream);

  let ctx1 = displayRef.current ? displayRef.current.getContext('2d') : null;
  const videoRef = useRef(null);

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

  useEffect(() => {
    if (videoRef.current && virtualBgStream) {
      videoRef.current.srcObject = virtualBgStream;
    }
  }, [virtualBgStream]);
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

        if (virtualBgStream) {
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
            ctx1.drawImage(virtualBgRef.current, x, y, width, height);
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
      virtualBgStream
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
      toggleBackground,
      webcamStream
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
      toggleBackground,
      webcamStream
    ]
  );

  return (
    <MediaCanvasContext.Provider value={contextValue}>
      <>
        <video ref={videoRef} autoPlay style={{ display: 'none' }}>
          <track kind="captions" />
        </video>
        <video ref={webcamVideoRef} autoPlay style={{ display: 'none' }}>
          <track kind="captions" />
        </video>
        <canvas
          ref={virtualBgRef}
          width={1280}
          height={720}
          style={{
            display: 'none'
          }}
        />
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
