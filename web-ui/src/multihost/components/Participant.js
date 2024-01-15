import React, { useRef, useEffect } from 'react';
import Video from './Video.js';
import Placeholder from './Placeholder.js';
const { StreamType } = window.IVSBroadcastClient;

export default function Participant({ id, userId, videoStopped, audioMuted, streams }) {
    const videoStream = streams.find((stream) => stream.streamType === StreamType.VIDEO);
    const audioStream = streams.find((stream) => stream.streamType === StreamType.AUDIO);

    const audioRef = useRef(undefined);

    useEffect(() => {
        if (audioRef.current && audioStream) {
            audioRef.current.srcObject = new MediaStream([audioStream.mediaStreamTrack]);
        }
    }, [audioRef, audioStream]);

    return (
        <div className="column column-40" id="local-media" style={{ display: 'flex' }}>
            <div className="participantContainer">
                {videoStream && !videoStopped ? <Video stageStream={videoStream} isParticipant={true}/> : <Placeholder userId={userId} />}
                <audio ref={audioRef} autoPlay />
                {audioMuted ? <span>Audio Muted</span> : undefined}
            </div>
        </div>
    );
}
