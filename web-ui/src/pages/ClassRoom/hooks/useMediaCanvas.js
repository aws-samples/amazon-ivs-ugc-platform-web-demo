import React, { useState, useEffect, createContext, useContext } from 'react';
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
    canvas1Ref,
    canvas2Ref,
    canvasVideoRef,
    isCanvas2Active,
    setIsCanvas2Active,
    smallVideoPosition,
    currentDragPosition,
    handleMouseDownCanvas1,
    handleMouseMoveCanvas1,
    handleMouseUpCanvas1
  } = useCanvasDrawing(isSmall);

  let ctx1 = canvas1Ref.current ? canvas1Ref.current.getContext('2d') : null;

  useEffect(() => {
    canvas1Ref.current && drawOnCanvas1();

    setTimeout(() => {
      if (canvas1Ref.current) {
        const stream = canvas1Ref.current.captureStream(30);
        setCombinedStream(stream);
      }
    }, 2000);

    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach((track) => track.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleToggleScreenShare = () => {
    toggleScreenShare(!screenStream);
  };

  const handleToggleCanvas2 = () => {
    setIsCanvas2Active((prev) => !prev);
    setIsSmall((prev) => !prev);
  };

  useEffect(() => {
    drawOnCanvas1();
    canvas2Ref.current && drawOnCanvas2();
  }, [isCanvas2Active, webcamStream, screenStream, isSmall, canvas2Ref,isVideoMuted]);

  useEffect(() => {
    drawOnCanvas1(currentDragPosition);
  }, [currentDragPosition]);

  const drawOnCanvas1 = (dragPosition = null) => {
    console.log('isVideoMuted',isVideoMuted)
    const draw = () => {
      ctx1?.clearRect(
        0,
        0,
        canvas1Ref.current.width,
        canvas1Ref.current.height
      );

      if (isCanvas2Active) {
        ctx1?.drawImage(canvas2Ref.current, 0, 0);
      }

      if (screenStream && !isCanvas2Active) {
        ctx1?.drawImage(
          screenShareVideoRef.current,
          0,
          0,
          canvas1Ref.current.width,
          canvas1Ref.current.height
        );
      }

      if (webcamStream) {
        const smallWidth = canvas1Ref.current.width * 0.2;
        const smallHeight = canvas1Ref.current.height * 0.2;
        // Use dragPosition if available, otherwise fall back to smallVideoPosition
        const position = dragPosition || smallVideoPosition;
        const x = isSmall ? position.x : 0;
        const y = isSmall ? position.y : 0;
        const width = isSmall ? smallWidth : canvas1Ref.current.width;
        const height = isSmall ? smallHeight : canvas1Ref.current.height;

        if (isVideoMuted && ctx1) {
          ctx1.fillStyle = 'black';
          ctx1.fillRect(0, 0, width, height);
        } else {
          ctx1?.drawImage(webcamVideoRef.current, x, y, width, height);
        }
        // ctx1?.drawImage(webcamVideoRef.current, x, y, width, height);
      }

      requestAnimationFrame(draw);
    };

    requestAnimationFrame(draw);
  };

  

  const drawOnCanvas2 = () => {
    let ctx2 = canvas2Ref.current ? canvas2Ref.current.getContext('2d') : null;
    ctx2.fillStyle = 'white';
    ctx2.fillRect(
      0,
      0,
      canvas2Ref?.current?.width,
      canvas2Ref?.current?.height
    );
    ctx2.strokeStyle = '#000000';
    ctx2.lineWidth = 2;
  };

  const toggleScreenShare = (activate) => {
    if (activate) {
      getScreenShare();
    } else {
      if (screenStream) {
        let tracks = screenStream.getTracks();
        tracks.forEach((track) => track.stop());
        setScreenStream(null);
        setIsSmall(false);
      }
    }
  };

  return (
    <MediaCanvasContext.Provider
      value={{
        isSmall,
        isCanvas2Active,
        setIsCanvas2Active,
        displayCanvasRef: canvas1Ref,
        whiteboardCanvasRef: canvas2Ref,
        displayCanvasMouseDown: handleMouseDownCanvas1,
        displayCanvasMouseMove: handleMouseMoveCanvas1,
        displayCanvasMouseUp: handleMouseUpCanvas1,
        combinedStream,
        handleToggleScreenShare,
        handleToggleCanvas2,
        setIsVideoMuted
      }}
    >
      <>
        <video
          ref={webcamVideoRef}
          autoPlay
          style={{ display: 'none' }}
        ><track kind="captions" /></video>
        <video
          ref={screenShareVideoRef}
          autoPlay
          style={{ display: 'none' }}
        ><track kind="captions" /></video>
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
