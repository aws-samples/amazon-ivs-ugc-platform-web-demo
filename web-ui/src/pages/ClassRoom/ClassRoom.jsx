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
import ParticipantList from './components/ParticipantList.jsx';

const Accordion = () => {

  const [isOpen, setIsOpen] = useState(false);

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-gray-100 pb-1 pl-2 rounded-md shadow-md">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={toggleAccordion}
        >
          <h2 className="text-lg font-semibol text-black">Participants</h2>
          <svg
            className={`w-6 h-6 ${isOpen ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            ></path>
          </svg>
        </div>
        {isOpen && (
          <div className="mt-1 z-50 h-1/2">
            <ParticipantList />
          </div>
        )}
      </div>
    </div>
  );
}
const ClassroomApp = () => {
  const { isWhiteBoardActive, toggleWhiteBoard,isSmall } = useMediaCanvas();

  return (
    <div className="flex flex-col h-screen">
      <StageParticipants />
      <MainTeacher />
      <VideoControls />
      <div className='w-1/4 border-l-2 border-gray-300 rounded bg-white'>
        <div className="w-1/4 absolute top-0 right-0 overflow-y-auto bg-gray-200 ">
         <Accordion/>
        </div>
        <div className="w-1/4 h-3/4 absolute bottom-3 right-0 overflow-y-auto">
          <ChatManager/>
        </div>
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
