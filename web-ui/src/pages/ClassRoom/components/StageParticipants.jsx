import React, { useContext, useEffect, useRef, useState } from 'react';
import { StageContext } from '../contexts/StageContext.js';
import { BroadcastContext } from '../contexts/BroadcastContext.js';
import Participant from './Participant.jsx';

export default function StageParticipants() {
  const { participants } = useContext(StageContext);
  const { broadcastClient } = useContext(BroadcastContext);
  const canvasRef = useRef(undefined);

  useEffect(() => {
    if (canvasRef.current && broadcastClient) {
      broadcastClient.attachPreview(canvasRef.current);
    }
  }, [broadcastClient, canvasRef]);

  return (
    <>
    <div className="flex flex-wrap items-stretch h-1/4 w-3/4 items-center">
      {[...participants.keys()].slice(0, 4).map((key) => {
        return <Participant key={key} {...participants.get(key)} />;
      })}
      {participants.keys().length >= 5 && (
        <div className="w-1/5 h-auto p-1 border-md border-2">
          <div className="flex flex-col h-full rounded-lg shadow">
            <div className="flex h-full w-full text-center relative items-center justify-center text-white">
              More ...
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
