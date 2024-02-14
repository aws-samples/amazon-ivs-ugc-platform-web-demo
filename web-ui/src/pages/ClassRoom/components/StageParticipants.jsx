import React from 'react';
import Participant from './Participant.jsx';

export default function StageParticipants({stageParticipants}) {
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
