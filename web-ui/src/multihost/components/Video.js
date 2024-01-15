import React, { useRef, useEffect, useState, useContext } from 'react';
import MediaControls from './MediaControls';
import Button from './Button.js';
import { LocalMediaContext } from '../contexts/LocalMediaContext.js';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice.jsx';
import Tooltip from '../../components/Tooltip/Tooltip.jsx';
import { MicOff, MicOn, VideoCamera, VideoCameraOff } from '../../assets/icons/index.js';
import { clsm } from '../../utils.js';
import { Stop } from '../../assets/icons/index.js';
const { StreamType } = window.IVSBroadcastClient;

export default function Video({ stageStream, stageJoined, joinOrLeaveStage }) {
    const videoRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (videoRef.current && stageStream) {
            videoRef.current.srcObject = new MediaStream([stageStream.mediaStreamTrack]);
        }
    }, [videoRef, stageStream]);

    const { currentAudioDevice, currentVideoDevice } = useContext(LocalMediaContext);
    const { isTouchscreenDevice } = useResponsiveDevice();

    const [audioMuted, setAudioMuted] = useState(true);
    const [videoMuted, setVideoMuted] = useState(true);
    if (currentAudioDevice && audioMuted !== currentAudioDevice.isMuted) {
        setAudioMuted(currentAudioDevice.isMuted);
    }

    function toggleDeviceMute(device) {
        device.setMuted(!device.isMuted);
        if (device.streamType === StreamType.VIDEO) {
            setVideoMuted(device.isMuted);
        } else {
            setAudioMuted(device.isMuted);
        }
    }

    if (currentVideoDevice && videoMuted !== currentVideoDevice.isMuted) {
        setVideoMuted(currentVideoDevice.isMuted);
    }

    const ACTIVE_BUTTON_COLORS = [
        'bg-darkMode-blue',
        'dark:bg-darkMode-blue',
        'dark:hover:bg-darkMode-blue-hover',
        'focus:bg-darkMode-blue',
        'focus:dark:bg-darkMode-blue',
        'hover:bg-lightMode-blue-hover',
        '[&>svg]:fill-white'
      ];
      const INACTIVE_BUTTON_COLORS = [
        'bg-darkMode-red',
        'dark:bg-darkMode-red',
        'dark:hover:bg-darkMode-red-hover',
        'focus:bg-darkMode-red',
        'focus:dark:bg-darkMode-red',
        'hover:bg-lightMode-red-hover',
        '[&>svg]:fill-white'
      ];

    return (
        <div
      style={{ position: 'relative', width: '100%', overflow: 'hidden' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
        >
            <video ref={videoRef} autoPlay playsInline/>
            {(
            <div
            style={{
                position: 'absolute',
                bottom: 0,
                width: '100%',
                color: '#fff',
                textAlign: 'center',
                padding: '8px',
                boxSizing: 'border-box',
                display: 'flex',
                justifyContent: 'space-between',
            }}
            >
                <div className={`${!audioMuted ? `bg-red-500`: `bg-blue-400`} rounded-3xl p-1`}>
                    <Tooltip
                    key={`wb-control-tooltip-mute-mic-tooltip`}
                    position="above"
                    message={audioMuted ? 'Unmute Mic' : 'Mute Mic'}
                    >
                        <Button
                            ariaLabel={'Mute Mic'}
                            key={`wb-control-btn-mute-icon`}
                            // ref={withRef && ref}
                            variant="icon"
                            onClick={() => toggleDeviceMute(currentAudioDevice)}
                            isDisabled={false}
                            disableHover={isTouchscreenDevice}
                            className={'h-4 w-4'}
                        >
                            {audioMuted ? <MicOff style={{ width: '30px', height: '30px'}}/> : <MicOn style={{ width: '30px', height: '30px' }}/>}
                        </Button>
                    </Tooltip>
                </div>
                <div className={`${!videoMuted ? `bg-red-500`: `bg-blue-400`} rounded-3xl p-1`}>
                    <Tooltip
                        key={`wb-control-tooltip-show-video-tooltip`}
                        position="above"
                        message={videoMuted ? 'Show Camera' : 'Hide Camera'}
                        >
                            <Button
                                ariaLabel={'Mute Mic'}
                                key={`wb-control-btn-video-icon`}
                                // ref={withRef && ref}
                                variant="icon"
                                onClick={() => toggleDeviceMute(currentVideoDevice)}
                                isDisabled={false}
                                disableHover={isTouchscreenDevice}
                                className={'h-4 w-4'}
                            >
                                {!videoMuted ? <VideoCamera style={{ width: '30px', height: '30px' }}/> : <VideoCameraOff style={{ width: '30px', height: '30px' }}/>}
                            </Button>
                        </Tooltip>
                </div>
                {stageJoined && <div className={` bg-red-500 rounded-3xl p-1`}>
                    <Tooltip
                        key={`wb-control-tooltip-show-video-tooltip`}
                        position="above"
                        message={'Stop Streaming'}
                        >
                            <Button
                                ariaLabel={'Mute Mic'}
                                key={`wb-control-btn-video-icon`}
                                // ref={withRef && ref}
                                variant="icon"
                                onClick={() => joinOrLeaveStage()}
                                isDisabled={false}
                                disableHover={isTouchscreenDevice}
                                className={'h-4 w-4'}
                            >
                                {<Stop style={{ width: '30px', height: '30px' }}/>}
                            </Button>
                        </Tooltip>
                </div>}
            </div>
        )}
        </div>
    );
}
