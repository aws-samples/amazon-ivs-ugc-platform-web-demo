import React, { useRef, useEffect, useContext } from 'react';
import Video from './Video';
import Placeholder from './Placeholder';
import { LocalMediaContext } from '../contexts/LocalMediaContext.js';
import {
  MicOff,
  MicOn,
  VideoCamera,
  VideoCameraOff,
  ScreenShare,
  ScreenShareOff,
  Play,
  Stop
} from '../../../assets/icons/index.js';
const { StreamType } = window.IVSBroadcastClient;

export default function Participant({
  id,
  userId="User",
  videoStopped,
  audioMuted,
  streams = []
}) {
  const { currentVideoDevice } = useContext(LocalMediaContext);

  const videoStream =
    streams.find((stream) => stream.streamType === StreamType.VIDEO)
  const audioStream = streams.find(
    (stream) => stream.streamType === StreamType.AUDIO
  );

  const audioRef = useRef(undefined);

  useEffect(() => {
    if (audioRef.current && audioStream) {
      audioRef.current.srcObject = new MediaStream([
        audioStream.mediaStreamTrack
      ]);
    }
  }, [audioRef, audioStream]);

  return (
    <div className="w-1/5 h-auto p-1 border-md border-2 mr-1 border-[grey]">
      <div className="flex flex-col h-full rounded-lg shadow">
        {/* Video feed placeholder */}
        <div className="h-full w-full text-center relative">
          {videoStream && !videoStopped ? (
            <Video stageStream={videoStream} />
          ) : (
            <Placeholder userId={userId} />
          )}
          <audio ref={audioRef} autoPlay ><track kind="captions" /></audio>
          <span
            className="absolute bottom-0 left-0 right-0 h-10 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
          >
            {audioMuted ? (
              <MicOn style={{ height: 20 }} />
            ) : (
              <MicOff style={{ height: 20 }} />
            )}{' '}
            {userId}
          </span>
        </div>
      </div>
    </div>
  );
}
