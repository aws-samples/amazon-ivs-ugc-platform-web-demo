/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useChat } from '../../contexts/Chat.jsx';
import { clsm } from '../../utils.js';
import ChatManager from './components/ChatManager.jsx';
import MainTeacher from './components/MainTeacher.jsx';
import ParticipantList from './components/ParticipantList.jsx';
import StageParticipants from './components/StageParticipants.jsx';
import VideoControls from './components/VideoControls.jsx';
import { StageContext } from './contexts/StageContext.js';
import { useMediaCanvas } from './hooks/useMediaCanvas.js';
const { LocalStageStream } = window.IVSBroadcastClient;
const aspectRatio = 16 / 9;

const Accordion = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="p-2 rounded-md shadow-md">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={toggleAccordion}
        >
          <i className="text-black">Participants</i>
          <svg
            className={`w-4 h-4 ${isOpen ? 'transform rotate-180' : ''}`}
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
          <div className="z-50 max-h-80 overflow-y-auto">
            <ParticipantList />
          </div>
        )}
      </div>
    </div>
  );
};
const ClassroomApp = () => {
  const {
    isVideoMuted, displayRef, 
    isSmall,
    combinedStream,
    toggleScreenShare,
    toggleWhiteBoard,
    isWhiteBoardActive,
    isScreenShareActive,
    setIsVideoMuted,
    toggleBackground
  } = useMediaCanvas();
  const {
    joinRequestStatus,
    stageData,
    setStageData,
    isStageOwner,
    setIsStageOwner,
    sendDrawEvents,
    receiveDrawEvents,
    userData,
    annotationCanvasState,
    startSSWithAnnots,
    stopSSWithAnnots
  } = useChat();

  const { participants, localParticipant } = useContext(StageContext);
  const [stageParticipants, setStageParticipants] = useState();
  const [remoteParticipant, setRemoteParticipant] = useState({});
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        let height = 0;
        if (annotationCanvasState?.aspectRatio) {
          height = containerWidth / annotationCanvasState?.aspectRatio;
        } else {
          height = containerWidth / aspectRatio;
        }
        setDimensions({ width: containerWidth, height });
      }
    };

    window.addEventListener('resize', updateCanvasSize);
    updateCanvasSize();

    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [annotationCanvasState]);

  useEffect(() => {
    const combinedStageStream = combinedStream
      ? new LocalStageStream(combinedStream?.getVideoTracks()[0], {
          simulcast: { enabled: true }
        })
      : null;

    let newParticipantsMap = new Map(participants);

    if (annotationCanvasState.participantId) {
      const rParticipant = participants.get(
        annotationCanvasState.participantId
      );
      setRemoteParticipant(rParticipant);

      newParticipantsMap.delete(annotationCanvasState.participantId);

      if (
        localParticipant &&
        localParticipant.id !== annotationCanvasState.participantId
      ) {
        localParticipant.streams = [
          ...(localParticipant?.streams || []),
          combinedStageStream
        ];
        newParticipantsMap.set(localParticipant.id, localParticipant);
      }
    } else {
      if (localParticipant) {
        newParticipantsMap.delete(localParticipant.id);
        setStageParticipants((prev) => prev?.delete(localParticipant.id));
      }

      if (
        remoteParticipant &&
        !newParticipantsMap.has(remoteParticipant.id) &&
        remoteParticipant.id &&
        !annotationCanvasState.participantId
      ) {
        newParticipantsMap.set(remoteParticipant.id, remoteParticipant);
      }
    }

    setStageParticipants(newParticipantsMap);
  }, [
    participants,
    annotationCanvasState,
    localParticipant,
    remoteParticipant,
    combinedStream
  ]);

  const chatConfig = {
    joinRequestStatus,
    stageData,
    setStageData,
    isStageOwner,
    setIsStageOwner,
    sendDrawEvents,
    receiveDrawEvents,
    annotationCanvasState,
    startSSWithAnnots,
    stopSSWithAnnots
  };
  const mediaConfig = {
    toggleScreenShare,
    toggleWhiteBoard,
    isWhiteBoardActive,
    isScreenShareActive,
    setIsVideoMuted,
    toggleBackground,
    isVideoMuted, displayRef 
  };

  return (
    <div className="flex flex-row h-screen">
      <div className="w-3/4 flex flex-col" ref={containerRef}>
        <StageParticipants stageParticipants={stageParticipants} />
        <MainTeacher
          dimensions={dimensions}
          chatConfig={chatConfig}
          activeUser={userData?.id}
          localParticipant={localParticipant}
          remoteParticipant={remoteParticipant}
        />
        <VideoControls
          {...chatConfig}
          {...mediaConfig}
          userData={userData}
          localParticipant={localParticipant}
        />
      </div>
      <div
        className={clsm(
          'w-1/4 border-l-2 border-gray-300 rounded bg-gray-100 flex flex-col',
          isSmall ? 'h-3/4' : 'h-full'
        )}
      >
        <div className="border-b-2 mb-1">
          <Accordion />
        </div>
        <div className="h-full overflow-y-auto">
          <ChatManager />
        </div>
      </div>
      <Modal isOpen={isSmall} {...mediaConfig}/>
    </div>
  );
};

const Modal = ({ isOpen, isVideoMuted, displayRef  }) => {

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
      } else if (displayRef.current) {
        ctx.drawImage(
          displayRef.current,
          0,
          0,
          canvas.width,
          canvas.height
        );
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen, isVideoMuted, displayRef]);

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
        // 'w-1/4 ',
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
