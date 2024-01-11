import React, { useEffect, useState, useContext, useCallback } from 'react';
import LocalVideo from './LocalVideo.js';
// import Button from './Button.js';
import Select from './Select.js';
import { getDevices } from '../util/mediaDevices.js';
import { LocalMediaContext } from '../contexts/LocalMediaContext.js';
import { StageContext } from '../contexts/StageContext.js';
import { BroadcastContext } from '../contexts/BroadcastContext.js';
import { useLocalMedia } from '../hooks/useLocalMedia.js';
import Button from '../../../components/Button/Button.jsx';
import { clsm } from '../../../utils.js';
import { useUser } from '../../../contexts/User.jsx';
import { useChat } from '../../../contexts/Chat.jsx';
import { useLocation, useNavigate } from 'react-router-dom';

let USERS = [
  {
    channelResourceId: '3n1ejzrjjHCf',
    avatar: 'tiger',
    color: 'blue',
    ingestEndpoint: '76fbef28b182.global-contribute.live-video.net',
    ingestServerUrl:
      'rtmps://76fbef28b182.global-contribute.live-video.net:443/app/',
    playbackUrl:
      'https://76fbef28b182.us-east-1.playback.live-video.net/api/video/v1/us-east-1.107911280745.channel.3n1ejzrjjHCf.m3u8',
    streamKeyValue: 'sk_us-east-1_MglgYcPzHEE5_GVXIegqyYQtheTfmPWNITSQrJng5gF',
    username: 'Sush1',
    channelAssetUrls: {},
    trackingId: '3n1ejzrjjhcf',
    chatRoomArn: 'arn:aws:ivschat:us-east-1:107911280745:room/3l1MlMDudhlj',
    channelArn: 'arn:aws:ivs:us-east-1:107911280745:channel/3n1ejzrjjHCf',
    id: 'd870bb50-43af-46a7-860e-9df3a45a3b6b',
    followingList: [],
    avatarSrc: '/static/media/tiger.62e852f6e8a27dc9ccb9.png',
    joinToken:
      'eyJhbGciOiJLTVMiLCJ0eXAiOiJKV1QifQ.eyJleHAiOjE3MDQ4OTY2MDQsImlhdCI6MTcwNDg1MzQwNCwianRpIjoiZ3plOVg3NnZVNlN1IiwicmVzb3VyY2UiOiJhcm46YXdzOml2czp1cy1lYXN0LTE6MTA3OTExMjgwNzQ1OnN0YWdlLzU4Yk5HZE9JQVhJdiIsInRvcGljIjoiNThiTkdkT0lBWEl2IiwiZXZlbnRzX3VybCI6IndzczovL2dsb2JhbC5lZXZlZS5ldmVudHMubGl2ZS12aWRlby5uZXQiLCJ3aGlwX3VybCI6Imh0dHBzOi8vNzZmYmVmMjhiMTgyLmdsb2JhbC1ibS53aGlwLmxpdmUtdmlkZW8ubmV0IiwidXNlcl9pZCI6IlN1c2gxIiwiYXR0cmlidXRlcyI6eyJhdmF0YXJVcmwiOiIiLCJpc0hvc3QiOiJ0cnVlIiwidXNlcm5hbWUiOiJTdXNoMSJ9LCJjYXBhYmlsaXRpZXMiOnsiYWxsb3dfcHVibGlzaCI6dHJ1ZSwiYWxsb3dfc3Vic2NyaWJlIjp0cnVlfSwidmVyc2lvbiI6IjAuMCJ9.MGQCMD_qdN2fRZ7_dlUyyHLTlXPdOmkWbsAvSgv0TnBh7E0kr9uNQKzP9rfFFfb8YQ7oKwIwRLvQhP7bm2Rz_rp5DmKqTalptZd_osnn8ZWA-WFj4CKQE2AeT1nx3zeTa_BjuZvU'
  },
  {
    channelResourceId: 'EjFMqbw4gfTG',
    avatar: 'bird',
    color: 'green',
    ingestEndpoint: '76fbef28b182.global-contribute.live-video.net',
    ingestServerUrl:
      'rtmps://76fbef28b182.global-contribute.live-video.net:443/app/',
    playbackUrl:
      'https://76fbef28b182.us-east-1.playback.live-video.net/api/video/v1/us-east-1.107911280745.channel.EjFMqbw4gfTG.m3u8',
    streamKeyValue: 'sk_us-east-1_RSz4XAe4RsCr_B9waaCv0TPPsGnjs26HxV3hjWr5bFw',
    username: 'skshinde1',
    channelAssetUrls: {},
    trackingId: 'ejfmqbw4gftg',
    chatRoomArn: 'arn:aws:ivschat:us-east-1:107911280745:room/Y2QKwXrhOEFo',
    channelArn: 'arn:aws:ivs:us-east-1:107911280745:channel/EjFMqbw4gfTG',
    id: '6a0cc784-7511-4da6-a245-619e7b1e7c03',
    followingList: [],
    avatarSrc: '/static/media/bird.478db1c9abb765cb7704.png',
    joinToken:
      'eyJhbGciOiJLTVMiLCJ0eXAiOiJKV1QifQ.eyJleHAiOjE3MDQ4OTY1MzgsImlhdCI6MTcwNDg1MzMzOCwianRpIjoiM3lacG9qM0ZEVzAyIiwicmVzb3VyY2UiOiJhcm46YXdzOml2czp1cy1lYXN0LTE6MTA3OTExMjgwNzQ1OnN0YWdlLzU4Yk5HZE9JQVhJdiIsInRvcGljIjoiNThiTkdkT0lBWEl2IiwiZXZlbnRzX3VybCI6IndzczovL2dsb2JhbC5lZXZlZS5ldmVudHMubGl2ZS12aWRlby5uZXQiLCJ3aGlwX3VybCI6Imh0dHBzOi8vNzZmYmVmMjhiMTgyLmdsb2JhbC1ibS53aGlwLmxpdmUtdmlkZW8ubmV0IiwidXNlcl9pZCI6InNrc2hpbmRlMSIsImF0dHJpYnV0ZXMiOnsiYXZhdGFyVXJsIjoiIiwiaXNIb3N0IjoidHJ1ZSIsInVzZXJuYW1lIjoic2tzaGluZGUxIn0sImNhcGFiaWxpdGllcyI6eyJhbGxvd19wdWJsaXNoIjp0cnVlLCJhbGxvd19zdWJzY3JpYmUiOnRydWV9LCJ2ZXJzaW9uIjoiMC4wIn0.MGQCMHgXzGVB_FRqjU5B3CrlApB8rzNYX9DvNXoQ-6hb0A6cj6kJHPyeNS4QkOqynDR0zQIwE5Vc2VwiyIMrXHM_KjLf6Y0j1ypsBCdZKmBjbgTMbtORM9Uu_k7yeqbV4_RsbBbR'
  }
];

export default function LocalMedia() {
  const {
    init,
    startBroadcast,
    stopBroadcast,
    broadcastStarted,
    updateStreamKey
  } = useContext(BroadcastContext);
  // This is for development purposes. It checks to see if we have a valid token saved in the session storage
  const cachedStageToken = sessionStorage.getItem('stage-token');
  const cachedScreenshareStageToken = sessionStorage.getItem(
    'stage-screenshare-token'
  );
  const cachedIngestEndpoint = sessionStorage.getItem('ingest-endpoint');
  const cachedStreamKey = sessionStorage.getItem('stream-key');
  const [ingestEndpoint, setIngestEndpoint] = useState(
    cachedIngestEndpoint || ''
  );
  const [streamKey, setStreamKey] = useState(cachedStreamKey || '');
  const [stageToken, setStageToken] = useState(cachedStageToken || '');
  const [screenshareToken, setScreenshareToken] = useState(
    cachedScreenshareStageToken || ''
  );
  const { audioDevices, videoDevices, updateLocalAudio, updateLocalVideo } =
    useContext(LocalMediaContext);
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
    setIngestEndpoint(endpoint);
  }

  function handleStreamKeyChange(key) {
    updateStreamKey(key);
    setStreamKey(key);
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
    // console.log(userData);
  }

  function toggleScreenshare() {
    if (screenshareStageJoined) {
      unpublishScreenshare();
    } else {
      publishScreenshare(screenshareToken);
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
    <div className="row">
      <LocalVideo />
      <div className="column">
        <div className="row" style={{ marginTop: '2rem' }}>
          <div
            className="column"
            style={{ display: 'flex', marginTop: '1.5rem' }}
          >
            {(isModerator || isStageOwner) && (
              <Button
                onClick={joinOrLeaveStage}
                className={clsm([
                  'w-full',
                  'h-11',
                  'dark:[&>svg]:fill-black',
                  'relative',
                  '[&>svg]:h-6',
                  '[&>svg]:w-6',
                  'space-x-1',
                  'rounded-3xl',
                  stageJoined && [
                    'dark:bg-darkMode-red',
                    'bg-darkMode-red',
                    'hover:dark:bg-darkMode-red-hover',
                    'hover:bg-darkMode-red-hover',
                    'focus:bg-darkMode-red'
                  ]
                ])}
              >
                {stageJoined ? 'Leave ' : 'Create & Join '}Stage
              </Button>
            )}
          </div>
        </div>
        {/* <div className="row">
                    <div className="column">
                        <label htmlFor="screenshare-token">Screenshare Token</label>
                        <input
                            type="text"
                            id="screenshare-token"
                            name="screenshare-token"
                            value={screenshareToken}
                            onChange={(e) => setScreenshareToken(e.target.value)}
                        />
                    </div>
                    <div className="column" style={{ display: 'flex', marginTop: '1.5rem' }}>
                        <Button onClick={toggleScreenshare}>
                            {screenshareStageJoined ? 'Stop Screenshare' : 'Screenshare'}
                        </Button>
                    </div>
                </div>
                <div className="row">
                    <div className="column">
                        <Select options={videoDevices} onChange={updateLocalVideo} title={'Select Webcam'} />
                    </div>
                    <div className="column">
                        <Select options={audioDevices} onChange={updateLocalAudio} title={'Select Mic'} />
                    </div>
                </div>
                <div className="row">
                    <div className="column">
                        <label htmlFor="ingest-endpoint">Ingest Endpoint</label>
                        <input
                            type="text"
                            id="ingest-endpoint"
                            name="ingest-endpoint"
                            value={ingestEndpoint}
                            onChange={(e) => handleIngestChange(e.target.value)}
                        />
                    </div>
                    <div className="column">
                        <label htmlFor="stream-key">Stream Key</label>
                        <input
                            type="text"
                            id="stream-key"
                            name="stream-key"
                            value={streamKey}
                            onChange={(e) => handleStreamKeyChange(e.target.value)}
                        />
                    </div>
                </div> */}
        {/* <div className="row">
          <div
            className="column"
            style={{ display: 'flex', marginTop: '1.5rem' }}
          >
            <Button
              onClick={toggleBroadcast}
              className={clsm([
                'w-full',
                'h-11',
                'dark:[&>svg]:fill-black',
                'relative',
                '[&>svg]:h-6',
                '[&>svg]:w-6',
                'space-x-1',
                'rounded-3xl',
                broadcastStarted && [
                  'dark:bg-darkMode-red',
                  'bg-darkMode-red',
                  'hover:dark:bg-darkMode-red-hover',
                  'hover:bg-darkMode-red-hover',
                  'focus:bg-darkMode-red'
                ]
              ])}
            >
              {broadcastStarted ? 'Stop Broadcast' : 'Start Broadcast'}
            </Button>
          </div>
        </div> */}
      </div>
    </div>
  );
}
