import React,{useState,useEffect,useRef} from 'react'
const useScreenShare = (setIsSmall) => {
    const screenShareVideoRef = useRef(null);
    const [screenStream, setScreenStream] = useState(null);
    const [isScreenShareActive, setIsScreenShareActive] = useState(false);
  
    const getScreenShare = async () => {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(stream);
        if (screenShareVideoRef.current) {
          screenShareVideoRef.current.srcObject = stream;
          setIsSmall(true)
          setIsScreenShareActive(true)
        }
        stream.getVideoTracks()[0].addEventListener("ended", () => {
          setScreenStream(null);
          setIsSmall(false)
          setIsScreenShareActive(false)
        });
      } catch (err) {
        console.error("Error accessing display media:", err);
      }
    };
  
    useEffect(() => {
      return () => {
        if (screenStream) {
          screenStream.getTracks().forEach((track) => track.stop());
        }
      };
    }, [screenStream]);
  
    return { screenShareVideoRef, screenStream, getScreenShare ,setScreenStream,isScreenShareActive,setIsScreenShareActive};
  };
  
  export default useScreenShare