import { useRef, useState, useEffect, useCallback } from 'react';
import { SelfieSegmentation } from '@mediapipe/selfie_segmentation';

const useVirtualBackground = (backgroundImageUrl, videoStream) => {
    const [isVirtualBackgroundActive, setIsVirtualBackgroundActive] = useState(false);
    const [virtualBgStream, setVirtualBgStream] = useState(null); // New state for virtual background stream
    const virtualBackgroundRef = useRef(null);
    const contextRef = useRef(null);
    const backgroundImageRef = useRef(null);
    const selfieSegmentationRef = useRef(null);

    useEffect(() => {
        selfieSegmentationRef.current = new SelfieSegmentation({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
        });
    }, []);

    const onResults = useCallback((results) => {
        const canvas = virtualBackgroundRef.current;
        const context = contextRef.current;
        if (!canvas || !context) return;

        context.clearRect(0, 0, canvas.width, canvas.height);

        if (isVirtualBackgroundActive && backgroundImageRef.current) {
            context.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);
            context.globalCompositeOperation = 'source-out';
            context.drawImage(backgroundImageRef.current, 0, 0, canvas.width, canvas.height);
            context.globalCompositeOperation = 'destination-atop';
        }

        context.drawImage(results.image, 0, 0, canvas.width, canvas.height);

            const stream = canvas.captureStream(30); 
            setVirtualBgStream(stream); 
        
    }, [isVirtualBackgroundActive]);

    useEffect(() => {
        if (!videoStream || !selfieSegmentationRef.current) return;

        const canvas = virtualBackgroundRef.current;
        contextRef.current = canvas.getContext('2d');
        const videoElement = document.createElement('video');
        videoElement.srcObject = videoStream;
        videoElement.play();

        let animationFrameId;

        const sendToMediaPipe = async () => {
            if (videoElement.readyState >= 2) {
                await selfieSegmentationRef.current.send({ image: videoElement });
            }
            animationFrameId = requestAnimationFrame(sendToMediaPipe);
        };

        const image = new Image();
        image.src = backgroundImageUrl;
        image.onload = () => {
            backgroundImageRef.current = image;
            selfieSegmentationRef.current.setOptions({ modelSelection: 1, selfieMode: true });
            selfieSegmentationRef.current.onResults(onResults);
            sendToMediaPipe();
        };

        return () => {
            videoElement.pause();
            videoElement.srcObject = null;
            cancelAnimationFrame(animationFrameId);
        };
    }, [backgroundImageUrl, videoStream, onResults]);

    const toggleVirtualBackground = useCallback(() => {
        setIsVirtualBackgroundActive(prev => !prev);
    }, []);

    return { toggleVirtualBackground, isVirtualBackgroundActive, virtualBackgroundRef, virtualBgStream };
};

export default useVirtualBackground;
