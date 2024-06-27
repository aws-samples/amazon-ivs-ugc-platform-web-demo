import memoize from 'fast-memoize';
import { useMemo, useState } from 'react';

import StageFactory from './StageFactory';
import useParticipants from './useParticipants';
import useStreams from './useStreams';

const {
  StageConnectionState,
  StageErrorCategory,
  StageEvents,
  StageParticipantPublishState
} = window.IVSBroadcastClient;

const CUSTOM_STAGE_EVENTS = {
  STAGE_PARTICIPANT_SHOULD_UNPUBLISH: 'stageParticipantShouldUnpublish',
  STAGE_PARTICIPANT_REPUBLISH_STATE_CHANGED:
    'stageParticipantRepublishStateChanged'
};

const {
  ERROR: STAGE_ERROR,
  STAGE_LEFT,
  STAGE_CONNECTION_STATE_CHANGED,
  STAGE_PARTICIPANT_JOINED,
  STAGE_PARTICIPANT_LEFT,
  STAGE_PARTICIPANT_PUBLISH_STATE_CHANGED,
  STAGE_PARTICIPANT_STREAMS_ADDED,
  STAGE_PARTICIPANT_STREAMS_REMOVED,
  STAGE_STREAM_MUTE_CHANGED
} = StageEvents;
const { STAGE_PARTICIPANT_REPUBLISH_STATE_CHANGED } = CUSTOM_STAGE_EVENTS;
const { CONNECTED, DISCONNECTED } = StageConnectionState;
const { PUBLISHED, NOT_PUBLISHED } = StageParticipantPublishState;

function useStage(stageConfig = {}, options = {}) {
  const {
    mediaStreams,
    streamMetadata,
    toggleLocalStageStreamMutedState,
    ...streamHandlers
  } = useStreams(stageConfig);
  const { participants, ...participantHandlers } = useParticipants(stageConfig);
  const [stageLeftReason, setStageLeftReason] = useState();
  const [connectError, setConnectError] = useState(null);
  const [publishError, setPublishError] = useState(null);
  const [connectState, setConnectState] = useState(DISCONNECTED);
  const [publishState, setPublishState] = useState(NOT_PUBLISHED);
  const [republishing, setRepublishing] = useState(false);

  const subscribeOnly =
    connectState === CONNECTED && publishState !== PUBLISHED;

  const [stage] = useState(function createStage() {
    const stg = StageFactory.create(stageConfig);

    // Initialize simulcast configuration
    if (options.simulcast !== undefined) {
      stg.strategyMutators.setSimulcast(options.simulcast);
    }

    // Register stage events strictly for UI state management
    stg.on(STAGE_ERROR, onStageError);
    stg.on(STAGE_LEFT, setStageLeftReason);
    stg.on(STAGE_CONNECTION_STATE_CHANGED, onConnectionStateChanged);
    stg.on(STAGE_PARTICIPANT_PUBLISH_STATE_CHANGED, onPublishStateChanged);
    stg.on(STAGE_PARTICIPANT_REPUBLISH_STATE_CHANGED, setRepublishing);
    stg.on(STAGE_PARTICIPANT_JOINED, participantHandlers.upsertParticipant);
    stg.on(STAGE_PARTICIPANT_LEFT, participantHandlers.removeParticipant);
    stg.on(STAGE_PARTICIPANT_STREAMS_ADDED, streamHandlers.upsertStreams);
    stg.on(STAGE_PARTICIPANT_STREAMS_REMOVED, streamHandlers.removeStreams);
    stg.on(STAGE_STREAM_MUTE_CHANGED, participantHandlers.upsertParticipant);
    stg.on(STAGE_STREAM_MUTE_CHANGED, streamHandlers.upsertStreams);

    return stg;
  });

  queueMicrotask(() => {
    if (stage && options.audioOnly !== undefined) {
      stage.audioOnly = options.audioOnly; // Update the audio-only state
    }
  });

  function onConnectionStateChanged(state) {
    setConnectState(state);

    if (state !== DISCONNECTED) {
      setStageLeftReason(undefined);
    }

    if (state === CONNECTED || state === DISCONNECTED) {
      setConnectError(null); // Reset the connect error
    }
  }

  function onPublishStateChanged(participant, state) {
    setPublishState(state);
    participantHandlers.upsertParticipant(participant);
    if (state === PUBLISHED || state === NOT_PUBLISHED) {
      setPublishError(null); // Reset the publish error
    }
  }

  function onStageError(error) {
    if (error.category === StageErrorCategory.JOIN_ERROR) {
      setConnectError(error); // Update the connect error
    }
    if (error.category === StageErrorCategory.PUBLISH_ERROR) {
      setPublishError(error); // Update the publish error
    }
  }

  const getParticipants = useMemo(() => {
    return memoize(
      (filters = {}) => {
        const ppts = [];
        const keys = Object.keys(filters);
        participants.forEach((participant, participantId) => {
          const shouldInclude = keys.every((key) => {
            if (key === 'canSubscribeTo') {
              return (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                participant.capabilities?.has('subscribe') === filters[key]
              );
            }
            return participant[key] === filters[key];
          });
          if (shouldInclude) {
            ppts.push({
              ...participant,
              mediaStream: mediaStreams.get(participantId),
              streamMetadata: streamMetadata.get(participantId)
            });
          }
        });
        return ppts;
      },
      { strategy: memoize.strategies.variadic }
    );
  }, [mediaStreams, participants, streamMetadata]);

  return useMemo(
    () => ({
      connectState,
      connectError,
      publishState,
      publishError,
      republishing,
      subscribeOnly,
      stageLeftReason,
      getParticipants,
      toggleLocalStageStreamMutedState,
      on: stage.on,
      off: stage.off,
      emit: stage.emit,
      join: stage.join,
      leave: stage.leave,
      publish: stage.strategyMutators.publish,
      unpublish: stage.strategyMutators.unpublish,
      setSimulcast: stage.strategyMutators.setSimulcast,
      updateStreamsToPublish: stage.strategyMutators.updateStreamsToPublish
    }),
    [
      stage,
      connectState,
      connectError,
      publishState,
      publishError,
      republishing,
      subscribeOnly,
      stageLeftReason,
      getParticipants,
      toggleLocalStageStreamMutedState
    ]
  );
}

export default useStage;
