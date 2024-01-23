import React, { useState, useEffect, useRef,useCallback } from 'react';
import {
  MicOff,
  MicOn,
  VideoCamera,
  VideoCameraOff
} from '../../assets/icons/index.js';
import MainTeacher from './components/MainTeacher.jsx';
import StageParticipants from './components/StageParticipants.jsx';
import VideoControls from './components/VideoControls.jsx';
import LocalMedia from './components/LocalMedia.jsx';
import { useMediaCanvas } from './hooks/useMediaCanvas.js';
import ChatManager from './components/ChatManager.jsx';
import useWebcam from './hooks/useWebCam.js';
import { clsm } from '../../utils.js';

const ClassroomApp = () => {
  const { isWhiteBoardActive, toggleWhiteBoard,isSmall } = useMediaCanvas();

  return (
    <div className="flex flex-col h-screen">
      <StageParticipants />
      <MainTeacher />
      <VideoControls />

      <div className="w-1/4 h-screen fixed top-0 right-0 overflow-y-auto bg-white border-l-2 border-gray-300">
        <ChatManager />
      </div>

      <Modal isOpen={isSmall} />
    </div>
  );
};

const Modal = ({ isOpen, onClose }) => {
  const { webcamVideoRef, webcamStream } = useMediaCanvas();
  const smallVideoRef = useRef(null);

  useEffect(() => {
    const canvas = smallVideoRef.current;
    const ctx = canvas ? canvas.getContext('2d') : null;

    if (!canvas || !ctx || !webcamStream || !isOpen) return;

    let animationFrameId;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (webcamStream && webcamVideoRef.current) {
        ctx.drawImage(webcamVideoRef.current, 0, 0, canvas.width, canvas.height);
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [smallVideoRef, webcamStream, webcamVideoRef, isOpen]);

  return (
    <div className={clsm([
      'fixed',
      'right-0',
      'bottom-0',
      'w-1/4 ',
      'bg-white',
      isOpen?'h-1/4':'h-0',
      'overflow-auto',
      'mt-auto',
      'border'
    ])}  >
      <canvas
        ref={smallVideoRef}
        width={1280}
        height={720}
        style={{
          height: '100%',
          width: '100%',
          borderWidth: 2,
          borderColor: 'grey'
        }}
      />
    </div>
  );
};

export default ClassroomApp;
