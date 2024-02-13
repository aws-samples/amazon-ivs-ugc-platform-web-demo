import React, { useState, useRef, useContext, useEffect } from 'react';
import { LocalMediaContext } from '../contexts/LocalMediaContext.js';
import { BroadcastContext } from '../contexts/BroadcastContext.js';
import Strategy from '../util/strategy.js';
import { useMediaCanvas } from './useMediaCanvas.js';
const {
  Stage,
  StageConnectionState,
  StageEvents,
  SubscribeType,
  LocalStageStream
} = window.IVSBroadcastClient;

export default function useStage(finalStream) {
  const {isSmall, combinedStream } = useMediaCanvas();
  const [stageJoined, setStageJoined] = useState(false);
  const [participants, setParticipants] = useState(new Map());
  const [localParticipant, setLocalParticipant] = useState({});
  const { currentVideoDevice, currentAudioDevice } =
    useContext(LocalMediaContext);
  const { addStream, removeStream } = useContext(BroadcastContext);
  const combinedStageStream = combinedStream
    ? new LocalStageStream(combinedStream?.getVideoTracks()[0], {
        simulcast: { enabled: true }
      })
    : null;
  const stageRef = useRef(undefined);
  const strategyRef = useRef(
    new Strategy(currentAudioDevice, combinedStageStream)
  );
  useEffect(() => {
    strategyRef.current.updateMedia(
      currentAudioDevice,
      combinedStageStream
    );
    if (stageRef.current && stageJoined) {
      stageRef.current.refreshStrategy();
    }
  }, [currentAudioDevice, combinedStageStream]);

  const handleParticipantJoin = (participantInfo) => {
    if (isLocalParticipant(participantInfo)) {
      setLocalParticipant(participantInfo);
    } else {
      const participant = createParticipant(participantInfo);
      // NOTE: we must make a new map so react picks up the state change
      setParticipants(new Map(participants.set(participant.id, participant)));
    }
  };

  const handleParticipantLeave = (participantInfo) => {
    if (isLocalParticipant(participantInfo)) {
      setLocalParticipant({});
    } else {
      if (participants.delete(participantInfo.id)) {
        setParticipants(new Map(participants));
      }
    }
  };

  const handleMediaAdded = (participantInfo, streams) => {
    const { id } = participantInfo;
    // add the media to the broadcast
    addStream(id, streams);
    if (!isLocalParticipant(participantInfo)) {
      let participant = participants.get(id);
      participant = {
        ...participant,
        streams: [...streams, ...participant?.streams]
      };
      setParticipants(new Map(participants.set(id, participant)));
    }
  };

  const handleMediaRemoved = (participantInfo, streams) => {
    const { id } = participantInfo;
    // remove media from the broadcast
    removeStream(id, streams);
    if (!isLocalParticipant(participantInfo)) {
      let participant = participants.get(id);
      const newStreams = participant.streams.filter(
        (existingStream) =>
          !streams.find(
            (removedStream) => existingStream.id === removedStream.id
          )
      );
      participant = { ...participant, streams: newStreams };
      setParticipants(new Map(participants.set(id, participant)));
    }
  };

  const handleParticipantMuteChange = (participantInfo, stream) => {
    if (!isLocalParticipant(participantInfo)) {
      const { id } = participantInfo;
      let participant = participants.get(id);
      participant = { ...participant, ...participantInfo };
      setParticipants(new Map(participants.set(id, participant)));
    }
  };

  const handleConnectionStateChange = (state) => {
    if (state === StageConnectionState.CONNECTED) {
      setStageJoined(true);
    } else if (state === StageConnectionState.DISCONNECTED) {
      setStageJoined(false);
    }
  };

  function leaveStage() {
    if (stageRef.current) {
      stageRef.current.leave();
    }
  }

  async function joinStage(token) {
    if (!token) {
      alert('Please enter a token to join a stage');
      return;
    }
    try {
      const stage = new Stage(token, strategyRef.current);
      stage.on(
        StageEvents.STAGE_CONNECTION_STATE_CHANGED,
        handleConnectionStateChange
      );
      stage.on(StageEvents.STAGE_PARTICIPANT_JOINED, handleParticipantJoin);
      stage.on(StageEvents.STAGE_PARTICIPANT_LEFT, handleParticipantLeave);
      stage.on(StageEvents.STAGE_PARTICIPANT_STREAMS_ADDED, handleMediaAdded);
      stage.on(
        StageEvents.STAGE_PARTICIPANT_STREAMS_REMOVED,
        handleMediaRemoved
      );
      stage.on(
        StageEvents.STAGE_STREAM_MUTE_CHANGED,
        handleParticipantMuteChange
      );

      stageRef.current = stage;

      await stageRef.current.join();

      // If we are able to join we know we have a valid token so lets cache it
      sessionStorage.setItem('stage-token', token);
    } catch (err) {
      console.error('Error joining stage', err);
      alert(`Error joining stage: ${err.message}`);
    }
  }

  return { joinStage, stageJoined, leaveStage, participants,localParticipant };
}

function createParticipant(participantInfo) {
  return {
    ...participantInfo,
    streams: []
  };
}

export function isLocalParticipant(info) {
  return info.isLocal;
}
