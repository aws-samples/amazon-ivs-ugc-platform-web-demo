import React, { useContext, useEffect } from 'react';
import { LocalMediaContext } from '../contexts/LocalMediaContext.js';
import Video from './Video.jsx';
import { StageContext } from '../contexts/StageContext.js';
import { BroadcastContext } from '../contexts/BroadcastContext.js';
import { useUser } from '../../../contexts/User.jsx';
import { useChat } from '../../../contexts/Chat.jsx';
import { useLocation } from 'react-router-dom';
import { useMediaCanvas } from '../hooks/useMediaCanvas.js';

export default function MainTeacher() {
  const { currentVideoDevice } = useContext(LocalMediaContext);
  const {
    displayCanvasRef,
    displayCanvasMouseDown,
    displayCanvasMouseMove,
    displayCanvasMouseUp
  } = useMediaCanvas();
  const {
    init,
    startBroadcast,
    stopBroadcast,
    broadcastStarted,
    updateStreamKey
  } = useContext(BroadcastContext);
  const {
    joinStage,
    stageJoined,
    leaveStage,
  } = useContext(StageContext);
  const { userData } = useUser();
  console.log(init, BroadcastContext, userData);
  const {
    isModerator,
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
        'https://pqyf6f3sk0.execute-api.us-east-1.amazonaws.com/prod/create',
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
      'https://pqyf6f3sk0.execute-api.us-east-1.amazonaws.com/prod/join',
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
    <div
      style={{ height: 'calc(100vh- 24px)' }}
      className="w-3/4 px-1 overflow-hidden"
    >
      {/* <button onClick={joinOrLeaveStage}>Join</button> */}
      <div className="h-full">
        <div className="w-full h-full bg-black">
          <canvas
            ref={displayCanvasRef}
            onMouseDown={displayCanvasMouseDown}
            onMouseMove={displayCanvasMouseMove}
            onMouseUp={displayCanvasMouseUp}
            onMouseLeave={displayCanvasMouseUp}
            width={1280}
            height={720}
            style={{ height: '100%', width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
}
