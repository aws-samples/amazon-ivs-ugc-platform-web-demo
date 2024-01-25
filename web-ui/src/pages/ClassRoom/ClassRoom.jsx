import React, { useEffect, useRef, useState } from 'react';
import { clsm } from '../../utils.js';
import ChatManager from './components/ChatManager.jsx';
import MainTeacher from './components/MainTeacher.jsx';
import ParticipantList from './components/ParticipantList.jsx';
import StageParticipants from './components/StageParticipants.jsx';
import VideoControls from './components/VideoControls.jsx';
import { useMediaCanvas } from './hooks/useMediaCanvas.js';
import useWebcam from './hooks/useWebCam.js';

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
  const { isSmall } = useMediaCanvas();

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
  const { isVideoMuted, webcamVideoRef } = useMediaCanvas();
  
  const smallVideoRef = useRef(null);

  useEffect(() => {
    if (!smallVideoRef.current || !isOpen) return;

    const canvas = smallVideoRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (isVideoMuted) {
        drawMutedMessage(ctx, canvas);
      } else if (webcamVideoRef.current) {
        ctx.drawImage(webcamVideoRef.current, 0, 0, canvas.width, canvas.height);
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen, isVideoMuted, webcamVideoRef]);

  const drawMutedMessage = (ctx, canvas) => {
    ctx.font = '40px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const x = canvas.width / 2;
    const y = canvas.height / 2;
    ctx.fillText('Camera Off', x, y);
  };

  return (
    <div
      className={clsm([
        'fixed',
        'right-0',
        'bottom-0',
        'w-1/4 ',
        isOpen ? 'h-1/4' : 'h-0',
        // 'overflow-auto',
        'mt-auto',
        'bg-[#f6f6f6]'
      ])}
    >
      <canvas
        ref={smallVideoRef}
        width={1280}
        height={720}
        style={{
          height: '100%',
          width: '100%'
        }}
      />
    </div>
  );
};

export default ClassroomApp;
