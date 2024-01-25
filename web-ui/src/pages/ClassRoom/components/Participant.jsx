import React, { useEffect, useRef } from 'react';
import {
  MicOff,
  MicOn
} from '../../../assets/icons/index.js';
import Placeholder from './Placeholder';
import Video from './Video';
const { StreamType } = window.IVSBroadcastClient;

export default function Participant({
  id,
  userId="User",
  videoStopped,
  audioMuted,
  streams = []
}) {

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
    <div className="w-1/5 h-auto p-1 border mr-1 ">
      <div className="flex flex-col h-full">
        <div className="h-full w-full text-center relative">
          {videoStream && !videoStopped ? (
            <Video stageStream={videoStream} />
          ) : (
            <Placeholder userId={userId} />
          )}
          <audio ref={audioRef} autoPlay ><track kind="captions" /></audio>
          <span
            className="absolute bottom-0 left-0 right-0 h-6 flex items-center justify-center text-black"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
          >
            {!audioMuted ? (
              <MicOn style={{ height: 15 }} />
            ) : (
              <MicOff style={{ height: 15 }} />
            )}{' '}
            {userId}
          </span>
        </div>
      </div>
    </div>
  );
}
