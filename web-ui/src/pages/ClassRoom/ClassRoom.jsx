import React, { useEffect, useRef } from 'react';
import { clsm } from '../../utils.js';
import ChatManager from './components/ChatManager.jsx';
import MainTeacher from './components/MainTeacher.jsx';
import ParticipantList from './components/ParticipantList.jsx';
import StageParticipants from './components/StageParticipants.jsx';
import VideoControls from './components/VideoControls.jsx';
import { useMediaCanvas } from './hooks/useMediaCanvas.js';
const ClassroomApp = () => {
  const { isSmall } = useMediaCanvas();

  return (
    <div className="flex flex-col h-screen">
      <StageParticipants />
      <MainTeacher />
      <VideoControls />

      <div className='w-1/4 border-l-2 border-gray-300 rounded'>
        <div className="w-1/4 h-1/5 fixed top-0 right-0 overflow-y-auto">
          <ParticipantList />
        </div>
        <div className="w-1/4 h-4/5 fixed bottom-2 right-0 overflow-y-auto">
          <ChatManager />
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
