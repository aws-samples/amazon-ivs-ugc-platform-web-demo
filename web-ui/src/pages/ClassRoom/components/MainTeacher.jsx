import React, { useContext, useEffect,useRef } from 'react';
import { LocalMediaContext } from '../contexts/LocalMediaContext.js';
import Video from './Video.jsx';
import { StageContext } from '../contexts/StageContext.js';
import { BroadcastContext } from '../contexts/BroadcastContext.js';
import { useUser } from '../../../contexts/User.jsx';
import { useChat } from '../../../contexts/Chat.jsx';
import { useLocation } from 'react-router-dom';
import { useMediaCanvas } from '../hooks/useMediaCanvas.js';
import { clsm } from '../../../utils.js';

export default function MainTeacher() {
  const { currentVideoDevice } = useContext(LocalMediaContext);
  const {
    isSmall,
    isWhiteBoardActive,
    displayRef,
    whiteboardRef,
    screenShareVideoRef,
    displayMouseDown,
    displayMouseMove,
    displayMouseUp
  } = useMediaCanvas();
  const {
    init,
    startBroadcast,
    stopBroadcast,
    broadcastStarted,
    updateStreamKey
  } = useContext(BroadcastContext);
  const { joinStage, stageJoined, leaveStage } = useContext(StageContext);
  const { userData } = useUser();
  console.log(init, BroadcastContext, userData);
  const {
    joinRequestStatus,
    stageData,
    setStageData,
    isStageOwner,
    setIsStageOwner
  } = useChat();
  const { state } = useLocation();
  console.log(joinRequestStatus, stageData);
  function handleIngestChange(endpoint) {
    init(endpoint);
  }
  let count = 0;

  function handleStreamKeyChange(key) {
    updateStreamKey(key);
  }

  async function joinOrLeaveStage() {
    if (stageJoined) {
      leaveStage();
    } else {
      const response = await fetch(
        'https://atwa6rbat3.execute-api.us-east-1.amazonaws.com/prod/create',
        {
          body: JSON.stringify({
            groupIdParam: `${userData?.username}`,
            userId: userData?.username,
            attributes: {
              avatarUrl: '',
              username: userData?.username
            },
            channelData: {
              ingestEndpoint: userData?.ingestEndpoint,
              playbackUrl: userData?.ingestEndpoint,
              streamKey: userData?.streamKeyValue,
              channelId: userData?.channelArn,
              roomId: userData?.chatRoomArn
            }
          }),
          method: 'POST'
        }
      );
      const createStageResponse = await response.json();

      setStageData(createStageResponse);
      setIsStageOwner(true);
      handleUserChange(createStageResponse?.stage?.token?.token);
    }
  }

  function toggleBroadcast() {
    if (broadcastStarted) {
      stopBroadcast();
    } else {
      isStageOwner && startBroadcast();
    }
  }

  function handleUserChange(joinToken) {
    handleIngestChange(userData.ingestEndpoint);
    handleStreamKeyChange(userData.streamKeyValue);
    joinStage(joinToken);
  }

  useEffect(() => {
    if (state) {
      state.joinAsParticipant && joinStageFn(state.groupId);
    }
  }, [state]);

  useEffect(() => {
    stageJoined && toggleBroadcast();
  }, [stageJoined]);

  const joinStageFn = async (groupId) => {
    if (count > 0) return;
    count = 1;
    const joinRes = await fetch(
      'https://atwa6rbat3.execute-api.us-east-1.amazonaws.com/prod/join',
      {
        body: JSON.stringify({
          groupId,
          userId: userData?.username,
          attributes: {
            avatarUrl: '',
            username: userData?.username
          }
        }),
        method: 'POST'
      }
    );
    const joinData = await joinRes.json();
    handleUserChange(joinData?.stage?.token?.token);
  };
  return (
    <div className="w-3/4 h-full overflow-hidden">
      <div className="h-full">
        <div className="w-full h-full bg-black">
          <canvas
            ref={displayRef}
            // onMouseDown={displayMouseDown}
            // onMouseMove={displayMouseMove}  //Uncomment these for draggable small video.
            // onMouseUp={displayMouseUp}
            // onMouseLeave={displayMouseUp}
            width={1280}
            height={720}
            style={{
              height: '100%',
              width: '100%',
              display: isWhiteBoardActive || isSmall ? 'none' : 'block'
            }}
          />
          {isWhiteBoardActive &&  <canvas
            ref={whiteboardRef}
            width={1280}
            height={720}
            style={{
              height: '100%',
              width: '100%',
              borderWidth: 2,
              borderColor: 'grey'
            }}
          />}
        {/* <video ref={webcamVideoRef} autoPlay style={{ display: 'none' }} /> */}
        <video ref={screenShareVideoRef} autoPlay style={{ display: !isSmall ||isWhiteBoardActive ? 'none' : 'block' }} />
<SmallVideo isOpen={isSmall}/>

        </div>
      </div>
    </div>
  );
}

const SmallVideo = ({ isOpen, onClose }) => {
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