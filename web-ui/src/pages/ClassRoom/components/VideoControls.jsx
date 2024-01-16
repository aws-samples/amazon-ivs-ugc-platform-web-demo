import React, { useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  CallDisconnect,
  MicOff,
  MicOn,
  ScreenShare,
  ScreenShareOff,
  VideoCamera,
  VideoCameraOff,
  WhiteBoard,
  WhiteBoardOff
} from '../../../assets/icons/index.js';
import { useChat } from '../../../contexts/Chat.jsx';
import { useUser } from '../../../contexts/User.jsx';
import { BroadcastContext } from '../contexts/BroadcastContext.js';
import { LocalMediaContext } from '../contexts/LocalMediaContext.js';
import { StageContext } from '../contexts/StageContext.js';
import { useMediaCanvas } from '../hooks/useMediaCanvas.js';

const { StreamType } = window.IVSBroadcastClient;
let count = 0;

export default function VideoControls() {
  const {
    isSmall,
    handleToggleScreenShare,
    handleToggleCanvas2,
    isCanvas2Active,setIsVideoMuted
  } = useMediaCanvas();
  const { currentAudioDevice, currentVideoDevice } =
    useContext(LocalMediaContext);
  const [audioMuted, setAudioMuted] = useState(true);
  const [videoMuted, setVideoMuted] = useState(true);

  if (currentAudioDevice && audioMuted !== currentAudioDevice.isMuted) {
    setAudioMuted(currentAudioDevice.isMuted);
  }
  const {
    init,
    startBroadcast,
    stopBroadcast,
    broadcastStarted,
    updateStreamKey
  } = useContext(BroadcastContext);
  console.log(init, BroadcastContext);
  const {
    joinStage,
    stageJoined,
    leaveStage,
    screenshareStageJoined,
    publishScreenshare,
    unpublishScreenshare
  } = useContext(StageContext);

  const { userData } = useUser();
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

  function handleStreamKeyChange(key) {
    updateStreamKey(key);
  }

  async function joinOrLeaveStage() {
    if (stageJoined) {
      leaveStage();
      if(isStageOwner){
        const joinRes = fetch('https://pqyf6f3sk0.execute-api.us-east-1.amazonaws.com/prod/delete', {
              body: JSON.stringify({
                groupId: stageData.groupId,
              }),
              method: 'DELETE',
            });
      }
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
    // console.log(userData);
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
    if (state && count === 0) {
      state.joinAsParticipant && joinStageFn(state.groupId);
    }
  }, [state]);

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

  function toggleDeviceMute(device) {
    device.setMuted(!device.isMuted);
    if (device.streamType === StreamType.VIDEO) {
      setVideoMuted(device.isMuted);
    setIsVideoMuted(device.isMuted)

    } else {
      setAudioMuted(device.isMuted);
    }
  }

  if (currentVideoDevice && videoMuted !== currentVideoDevice.isMuted) {
    setVideoMuted(currentVideoDevice.isMuted);
  }

  return (
    /* Video Controls Panel - fixed height */
    <div className="h-18 bg-gray-200 w-3/4 p-4">
      <div className="flex justify-center items-center px-4 h-full ">
       {!state?.joinAsParticipant && <button
          className="text-xs bg-gray-300 p-3 px-5 rounded-full mx-1"
          onClick={joinOrLeaveStage}
        >
         <span style={{ fontSize: 12, color: 'black' }}>
            {stageJoined ? 'Stop ' : 'Start '} Class
          </span>
        </button>}
        <button
          className="text-xs bg-gray-300 p-2 rounded-full mx-1"
          onClick={() => toggleDeviceMute(currentAudioDevice)}
        >
          {!audioMuted ? (
            <MicOn style={{ height: 20 }} />
          ) : (
            <MicOff style={{ height: 20 }} />
          )}
        </button>
        <button
          className="text-xs bg-gray-300 p-2 rounded-full mx-1"
          onClick={() => toggleDeviceMute(currentVideoDevice)}
        >
          {!videoMuted ? (
            <VideoCamera style={{ height: 20 }} />
          ) : (
            <VideoCameraOff style={{ height: 20 }} />
          )}
        </button>
        <button
          className="text-xs bg-gray-300 p-2 rounded-full mx-1"
          onClick={handleToggleScreenShare}
        >
          {!isSmall ? (
            <ScreenShare style={{ height: 20 }} />
          ) : (
            <ScreenShareOff style={{ height: 20 }} />
          )}
        </button>
        <button
          className="text-xs bg-gray-300 p-2 px-5 rounded-full mx-1"
          onClick={handleToggleCanvas2}
        >
          {!isSmall && !isCanvas2Active ? (
            <WhiteBoard style={{ height: 20 }} />
          ) : (
            <WhiteBoardOff style={{ height: 20 }} />
          )}
        </button>
        <button
          className="text-xs bg-gray-300 p-2 px-5 rounded-full mx-1"
          onClick={() => leaveStage()}
        >
          <CallDisconnect style={{ height: 20 }} />
        </button>
       {!state?.joinAsParticipant && <button
          className="text-xs bg-gray-300 p-3 px-5 rounded-full mx-1"
          onClick={toggleBroadcast}
        >
          <span style={{ fontSize: 12, color: 'black' }}>
            {' '}
            {broadcastStarted ? 'Stop ' : 'Start '} Streaming
          </span>
        </button>}
      </div>
    </div>
  );
}