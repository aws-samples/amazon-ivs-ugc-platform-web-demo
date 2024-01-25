import React, { useState, useEffect, useRef, useContext } from 'react';
import { LocalMediaContext } from '../contexts/LocalMediaContext';
const videoConstraints = {
  width: 1280,
  height: 720,
  frameRate: { ideal: 30 },
  aspectRatio: { ideal: 16 / 9 },
  resizeMode: 'crop-and-scale'
};
const useWebcam = () => {
  const { currentVideoDevice } = useContext(LocalMediaContext);
  const webcamVideoRef = useRef(null);
  const [webcamStream, setWebcamStream] = useState(null);

  useEffect(() => {
    const getWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints });
        setWebcamStream(stream);
        if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing media devices:", err);
      }
    };

    getWebcam();
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [currentVideoDevice]);

  return { webcamVideoRef, webcamStream };
};
export default useWebcam;
