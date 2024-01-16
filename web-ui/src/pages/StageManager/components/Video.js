import React, { useRef, useEffect } from 'react';

export default function Video({ stageStream }) {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && stageStream) {
            videoRef.current.srcObject = new MediaStream([stageStream.mediaStreamTrack]);
        }
    }, [videoRef, stageStream]);

    return <video ref={videoRef} autoPlay playsInline ><track kind="captions" /></video>;
}
