import React, { useContext } from 'react';
import { LocalMediaContext } from '../contexts/LocalMediaContext.js';
import Video from './Video.js';

export default function LocalVideo() {
    const { currentVideoDevice } = useContext(LocalMediaContext);
    return (
        <div className="column column-40" id="local-media" style={{ display: 'flex' }}>
            <div className="participantContainer">
                <Video stageStream={currentVideoDevice} />
            </div>
        </div>
    );
}
