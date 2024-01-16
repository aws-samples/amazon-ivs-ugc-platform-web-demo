import React, { useContext, useEffect, useRef, useState } from 'react';
import { StageContext } from '../contexts/StageContext.js';
import { BroadcastContext } from '../contexts/BroadcastContext.js';
import Participant from './Participant.jsx';

export default function StageParticipants() {
  const { participants } = useContext(StageContext);
  const { broadcastClient } = useContext(BroadcastContext);
  const canvasRef = useRef(undefined);
  const [dPT, setdPT] = useState([]);

  useEffect(() => {
    if (canvasRef.current && broadcastClient) {
      broadcastClient.attachPreview(canvasRef.current);
    }
  }, [broadcastClient, canvasRef]);

  return (
    <div className="flex flex-wrap items-stretch h-2/5 w-3/4 items-center">
      {[...participants.keys()].map((key) => {
        return <Participant key={key} {...participants.get(key)} />;
      })}

      {/* <button
        onClick={() => {
          dPT.length <= 4 &&
            setdPT((prev) => [...prev, { key: 'dsdsds', streams: [] }]);
        }}
        style={{ display: dPT.length <= 4 ? 'inline-block' : 'none' }}
      >
        Add
      </button> */}
    </div>
  );
}
