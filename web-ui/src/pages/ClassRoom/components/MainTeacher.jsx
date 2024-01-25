import React from 'react';
import { useMediaCanvas } from '../hooks/useMediaCanvas.js';

export default function MainTeacher() {
  const {
    isSmall,
    isWhiteBoardActive,
    displayRef,
    whiteboardRef,
    screenShareVideoRef
    // displayMouseDown,
    // displayMouseMove, //Uncomment these for draggable small video.
    // displayMouseUp
  } = useMediaCanvas();

  return (
    <div className="w-3/4 h-full  pr-2 ">
      <div className="h-full ">
        <div className="w-full h-full pr-2 ">
          <canvas
            ref={displayRef}
            // onMouseDown={displayMouseDown}
            // onMouseMove={displayMouseMove}  //Uncomment these for draggable small video.
            // onMouseUp={displayMouseUp}
            // onMouseLeave={displayMouseUp}
            width={1280}
            height={720}
            style={{
              height: '100%',
              width: '100%',
              display: isWhiteBoardActive || isSmall ? 'none' : 'block'
            }}
          />
          {isWhiteBoardActive && (
            <canvas
              ref={whiteboardRef}
              width={1280}
              height={720}
              style={{
                height: '100%',
                width: '100%',
                borderWidth: 1
              }}
            />
          )}
          <video
            ref={screenShareVideoRef}
            autoPlay
            style={{
              display: !isSmall || isWhiteBoardActive ? 'none' : 'block',
              height:'100%',
              width:'100%',
              objectFit:'contain'
            }}
          >
            <track kind="captions" ></track>
          </video>
        </div>
      </div>
    </div>
  );
}
