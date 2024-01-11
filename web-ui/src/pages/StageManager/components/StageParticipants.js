import React, { useContext, useEffect, useRef } from 'react';
import { StageContext } from '../contexts/StageContext.js';
import { BroadcastContext } from '../contexts/BroadcastContext.js';
import Participant from './Participant.js';

export default function StageParticipants() {
    const { participants } = useContext(StageContext);
    const { broadcastClient } = useContext(BroadcastContext);
    const canvasRef = useRef(undefined);
// console.log("inside stage participants", participants);
    useEffect(() => {
        if (canvasRef.current && broadcastClient) {
            broadcastClient.attachPreview(canvasRef.current);
        }
    }, [broadcastClient, canvasRef]);

    return (
        <div>
            {/* {broadcastClient ? <canvas ref={canvasRef} id="preview"></canvas> : undefined} */}
            {[...participants.keys()].map((key) => {
                return <Participant key={key} {...participants.get(key)} />;
            })}
        </div>
    );
}
