import React, { useContext, useState } from 'react';
import Button from './Button.js';
import { LocalMediaContext } from '../contexts/LocalMediaContext.js';
const { StreamType } = window.IVSBroadcastClient;

export default function MediaControls() {
    const { currentAudioDevice, currentVideoDevice } = useContext(LocalMediaContext);
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

    return (
        <section className="container" style={{ paddingBottom: '3rem' }}>
            <div className="row">
                <div className="column">
                    <Button onClick={() => toggleDeviceMute(currentAudioDevice)}>
                        {audioMuted ? 'Unmute Mic' : 'Mute Mic'}
                    </Button>
                </div>
                <div className="column">
                    <Button onClick={() => toggleDeviceMute(currentVideoDevice)}>
                        {videoMuted ? 'Show Camera' : 'Hide Camera'}
                    </Button>
                </div>
            </div>
        </section>
    );
}
