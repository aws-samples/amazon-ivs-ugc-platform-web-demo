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

      <Modal isOpen={isWhiteBoardActive} />
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
          // zIndex: 1000,
          borderWidth: 2,
          borderColor: 'grey'
        }}
      />
    </div>
  );
};


const ChatWindow = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {/* Chat messages will go here */}
        <ChatMessage message="How did you get the root(3) on the right side of the equation?" />
        {/* ... other messages */}
        {/* More <ChatMessage /> components can be added here */}
      </div>
      <div className="flex-shrink-0 bg-white border-t mb-2">
        <div className="flex">
          <input className="border p-2 flex-1" placeholder="Say something..." />
          <button className="bg-blue-500 text-white p-2 ">Send</button>
        </div>
      </div>
    </div>
  );
};

const ChatMessage = ({ message }) => {
  return (
    <div className=" border-b">
      <span>{message}</span>
    </div>
  );
};

export default ClassroomApp;
