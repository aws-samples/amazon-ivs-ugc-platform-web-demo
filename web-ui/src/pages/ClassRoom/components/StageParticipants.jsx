import React, { useContext, useEffect, useRef, useState } from 'react';
import { StageContext } from '../contexts/StageContext.js';
import { BroadcastContext } from '../contexts/BroadcastContext.js';
import Participant from './Participant.jsx';
import { isLocalParticipant } from '../hooks/useStage.js';

export default function StageParticipants({stageParticipants}) {
  // const { participants } = useContext(StageContext);
  // const { broadcastClient } = useContext(BroadcastContext);
  // const [stageParticipants, setStageParticipants] = useState();
  // const canvasRef = useRef(undefined);

  // // useEffect(() => {
  // //   if (canvasRef.current && broadcastClient) {
  // //     broadcastClient.attachPreview(canvasRef.current);
  // //   }
  // // }, [broadcastClient, canvasRef]);

  // useEffect(() => {
  //   let filteredParticipants = Array.from(participants).filter(
  //     ([key, value]) => !isLocalParticipant(value)
  //   );

  //   let filteredParticipantsMap = new Map(filteredParticipants);
  //   setStageParticipants(filteredParticipantsMap);
  // }, [participants]);

  return (
    <>
      {stageParticipants ? (
        <div className="flex flex-wrap items-stretch h-1/4 items-center ">
          {[...stageParticipants?.keys()].slice(0, 4).map((key) => {
            return <Participant key={key} {...stageParticipants?.get(key)} />;
          })}
          {stageParticipants?.keys().length >= 5 && (
            <div className="w-1/6 h-auto p-1 border-2">
              <div className="flex flex-col h-full">
                <div className="flex h-full w-full text-center relative items-center justify-center">
                  More ...
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
