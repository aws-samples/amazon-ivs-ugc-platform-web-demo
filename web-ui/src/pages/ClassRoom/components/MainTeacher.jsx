import React, { useEffect, useRef } from 'react';
import { useMediaCanvas } from '../hooks/useMediaCanvas.js';
import SharedCanvas from './SharedCanvas.jsx';
const { StreamType } = window.IVSBroadcastClient;
export default function MainTeacher({
  chatConfig,
  activeUser,
  dimensions,
  localParticipant,
  remoteParticipant
}) {
  const {
    isSmall,
    isWhiteBoardActive,
    displayRef,
    whiteboardRef,
    screenShareVideoRef
  } = useMediaCanvas();
  const { annotationCanvasState } = chatConfig;
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (
      remoteParticipant &&
      remoteParticipant?.id === annotationCanvasState?.participantId
    ) {
      const videoStream = remoteParticipant?.streams?.find(
        (stream) => stream.streamType === StreamType.VIDEO
      );
      if (remoteVideoRef.current && videoStream) {
        const stream = new MediaStream([videoStream.mediaStreamTrack]);
        remoteVideoRef.current.srcObject = stream;
      }
    }
  }, [remoteParticipant]);

  return (
    <div className="h-full">
      <div className="h-full ">
        <div className="w-full h-full relative">
          <canvas
            ref={displayRef}
            width={1280}
            height={720}
            style={{
              height: dimensions.height,
              width: dimensions.width,
              display:
                isWhiteBoardActive || isSmall || annotationCanvasState.open
                  ? 'none'
                  : 'block'
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
          {annotationCanvasState.open &&
            annotationCanvasState.participantId !== localParticipant?.id && (
              <video
                ref={remoteVideoRef}
                autoPlay
                style={{
                  display: !annotationCanvasState.open ? 'none' : 'block',
                  height: dimensions.height,
                  width: dimensions.width,
                  objectFit: 'fill'
                }}
              >
                <track kind="captions"></track>
              </video>
            )}

          <video
            ref={screenShareVideoRef}
            autoPlay
            style={{
              display: !isSmall || isWhiteBoardActive ? 'none' : 'block',
              height: dimensions.height,
              width: dimensions.width,
              objectFit: 'fill'
            }}
          >
            <track kind="captions"></track>
          </video>
          {annotationCanvasState.open ? (
            <SharedCanvas
              {...chatConfig}
              activeUser={activeUser}
              dimensions={dimensions}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
