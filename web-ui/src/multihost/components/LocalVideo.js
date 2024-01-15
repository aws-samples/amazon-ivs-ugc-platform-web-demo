import React, { useContext } from 'react';
import { LocalMediaContext } from '../contexts/LocalMediaContext.js';
import Video from './Video.js';
import MediaControls from './MediaControls.js';

export default function LocalVideo({joinOrLeaveStage, stageJoined}) {
    const { currentVideoDevice } = useContext(LocalMediaContext);
    return (
        <div className="column column-40" id="local-media" style={{ display: 'flex' }}>
            <div className="participantContainer">
                <Video stageStream={currentVideoDevice} stageJoined={stageJoined} joinOrLeaveStage={joinOrLeaveStage}/>
                {/* <MediaControls/> */}
            </div>
        </div>
    );
}
