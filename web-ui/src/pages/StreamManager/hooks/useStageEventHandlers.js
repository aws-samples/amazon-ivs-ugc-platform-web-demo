import { useCallback } from 'react';

import { createUserJoinedSuccessMessage } from '../../../helpers/stagesHelpers';
import { useGlobalStage } from '../../../contexts/Stage';
import { useNotif } from '../../../contexts/Notification';
import { PARTICIPANT_TYPES } from '../../../contexts/Stage/Global/reducer/globalReducer';

const {
  StageEvents,
  StageParticipantPublishState,
  StageParticipantSubscribeState
} = window.IVSBroadcastClient;

const useStageEventHandlers = ({
  client,
  updateSuccess,
  leaveStage,
  setShouldCloseFullScreenView
}) => {
  const {
    addParticipant,
    localParticipant,
    updateStreams,
    toggleMicrophoneState,
    toggleCameraState,
    isSpectator,
    updateIsSpectator,
    removeParticipant,
    strategy
  } = useGlobalStage();
  const isHost = localParticipant?.attributes?.type === PARTICIPANT_TYPES.HOST;

  const handleParticipantJoinEvent = useCallback(
    (participant) => {
      const {
        attributes: {
          username: participantUsername,
          participantTokenCreationDate = undefined // participantTokenCreationDate is undefined for stage creator
        },
        isLocal
      } = participant;
      if (isLocal) return;
      addParticipant(participant);
      /**
       * the "if" statement assesses participant timing compared to the local participant.
       * an undefined participantTokenCreationDate signifies the participant as the stage creator.
       * if participantTokenCreationDate is earlier than joinStageDateRef.current, participants joined before the local participant.
       */
      if (
        !participantTokenCreationDate ||
        participantTokenCreationDate <
          localParticipant?.attributes.participantTokenCreationDate
      )
        return;

      const successMessage =
        createUserJoinedSuccessMessage(participantUsername);
      updateSuccess(successMessage);
    },
    [addParticipant, updateSuccess, localParticipant]
  );

  const handleParticipantLeftEvent = useCallback(
    (participant) => {
      removeParticipant(participant.userId);
    },
    [removeParticipant]
  );

  const handlePartipantStreamsAddedEvent = useCallback(
    (participant, streams) => {
      if (participant.isLocal) return;
      updateStreams(participant.userId, streams);
    },
    [updateStreams]
  );

  const handleStreamMuteChangeEvent = useCallback(
    (participant, stream) => {
      const { isLocal, userId } = participant;
      const { isMuted, streamType } = stream;
      if (isLocal) return;

      if (streamType === 'audio') {
        toggleMicrophoneState(userId, isMuted);
      }
      if (streamType === 'video') {
        toggleCameraState(userId, isMuted);
      }
    },
    [toggleMicrophoneState, toggleCameraState]
  );

  const handleParticipantPublishStateChangedEvent = useCallback(
    (participant, state) => {
      // Error code 1403 (stage at capacity) is thrown when more than 12 participants are publishing
      const shouldUpdateSpectatorState =
        state === StageParticipantPublishState.ERRORED &&
        !participant.isPublishing &&
        participant.isLocal &&
        !isSpectator;

      if (shouldUpdateSpectatorState) {
        updateIsSpectator(true);
      }
    },
    [isSpectator, updateIsSpectator]
  );

  const handleParticipantSubscribeStateChangeEvent = useCallback(
    (_, state) => {
      if (state === StageParticipantSubscribeState.ERRORED) {
        client.refreshStrategy(strategy);
      }
    },
    [strategy, client]
  );
  const { notifyNeutral } = useNotif();

  const attachStageEvents = useCallback(
    (client) => {
      if (!client) return;
      client.on(StageEvents.STAGE_CONNECTION_STATE_CHANGED, (state) => {
        if (state === 'errored') {
          // if (!isHost) {
          notifyNeutral('Session has ended', { asPortal: true });

          setShouldCloseFullScreenView(true);
          leaveStage();
          // setIsFullScreenViewOpen(false);
          // }
        }
      });
      client.on(
        StageEvents.STAGE_PARTICIPANT_JOINED,
        handleParticipantJoinEvent
      );
      client.on(StageEvents.STAGE_PARTICIPANT_LEFT, handleParticipantLeftEvent);
      client.on(
        StageEvents.STAGE_PARTICIPANT_STREAMS_ADDED,
        handlePartipantStreamsAddedEvent
      );
      client.on(
        StageEvents.STAGE_STREAM_MUTE_CHANGED,
        handleStreamMuteChangeEvent
      );
      client.on(
        StageEvents.STAGE_PARTICIPANT_PUBLISH_STATE_CHANGED,
        handleParticipantPublishStateChangedEvent
      );
      client.on(
        StageEvents.STAGE_PARTICIPANT_SUBSCRIBE_STATE_CHANGED,
        handleParticipantSubscribeStateChangeEvent
      );
    },
    [
      handleParticipantJoinEvent,
      handleParticipantLeftEvent,
      handleParticipantPublishStateChangedEvent,
      handleParticipantSubscribeStateChangeEvent,
      handlePartipantStreamsAddedEvent,
      handleStreamMuteChangeEvent,
      isHost,
      leaveStage,
      notifyNeutral,
      setShouldCloseFullScreenView
    ]
  );

  return { attachStageEvents };
};

export default useStageEventHandlers;
