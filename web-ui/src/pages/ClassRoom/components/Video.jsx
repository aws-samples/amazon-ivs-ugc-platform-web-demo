import React, { useRef, useEffect } from 'react';
export default function Video({ stageStream, combinedStream }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && combinedStream) {
      videoRef.current.srcObject = combinedStream;
      return;
    }
    if (videoRef.current && stageStream) {
      const stream = new MediaStream([stageStream.mediaStreamTrack]);
      videoRef.current.srcObject = stream;
    }
  }, [videoRef, stageStream, combinedStream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
    ><track kind="captions" /></video>
  );
}
