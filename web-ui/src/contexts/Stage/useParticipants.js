import { useCallback, useMemo, useRef } from 'react';
import { LOCAL_KEY, PARTICIPANT_TYPES } from './Global/reducer/globalReducer';
import { useAppSync } from '../AppSync';
import { createUserJoinedSuccessMessage } from '../../helpers/stagesHelpers';
import channelEvents from '../AppSync/channelEvents';
import { stagesAPI } from '../../api';
import { useUser } from '../User';
import { useGlobalStage } from '.';

const { StageParticipantPublishState, StageConnectionState } =
  window.IVSBroadcastClient;

const useParticipants = () => {
  const {
    state: { participants, isSpectator, localScreenshareStream },
    addParticipant,
    removeParticipant,
    resetParticipants,
    updateIsSpectator,
    updateParticipant,
    updateStreams,
    updateSuccess,
    toggleMicrophoneState,
    toggleCameraState,
    stageConnectionErroredEventCallback
  } = useGlobalStage();
  const { userData } = useUser();
  const localParticipantAttributes = useRef();
  const { publish } = useAppSync();
  const participantInfo = useRef({
    isHost: false,
    hostChannelId: null
  });
  const localParticipant = participants.get(LOCAL_KEY);
  const { type = undefined } = localParticipant?.attributes || {};
  const isHost = type === PARTICIPANT_TYPES.HOST;
  const isRequestedUserType = type === PARTICIPANT_TYPES.REQUESTED;

  const handleParticipantJoinEvent = useCallback(
    (participant) => {
      const {
        attributes: {
          channelAssetsAvatarUrl,
          type,
          channelId,
          username: participantUsername,
          participantTokenCreationDate = undefined // participantTokenCreationDate is undefined for stage creator
        },
        isLocal
      } = participant;
      if (isLocal) {
        localParticipantAttributes.current = participant.attributes;

        if (type === PARTICIPANT_TYPES.HOST) {
          // Allows us to access host information inside of "handleParticipantConnectionChangedEvent" that
          // would've otherwise been reset, lost or inaccessible at that time
          participantInfo.current = {
            isHost: true,
            hostChannelId: participant.attributes.channelId
          };
        }

        return;
      }

      const updatedParticipant = {
        ...participant,
        attributes: {
          ...participant.attributes,
          channelAssetsAvatarUrl: decodeURIComponent(channelAssetsAvatarUrl)
        }
      };

      addParticipant(updatedParticipant);

      //   check whether user has requested to join
      if ([PARTICIPANT_TYPES.REQUESTED].includes(type)) {
        publish(
          channelId.toLowerCase(),
          JSON.stringify({
            type: channelEvents.STAGE_HOST_DELETE_REQUEST_TO_JOIN,
            channelId
          })
        );
      }
      /**
       * the "if" statement assesses participant timing compared to the local participant.
       * an undefined participantTokenCreationDate signifies the participant as the stage creator.
       * if participantTokenCreationDate is earlier than joinStageDateRef.current, participants joined before the local participant.
       */
      if (
        !participantTokenCreationDate ||
        participantTokenCreationDate <
          localParticipantAttributes?.current?.participantTokenCreationDate
      )
        return;

      const successMessage =
        createUserJoinedSuccessMessage(participantUsername);
      updateSuccess(successMessage);
    },
    [addParticipant, localParticipantAttributes, updateSuccess, publish]
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

  const handleParticipantConnectionChangedEvent = useCallback(
    async (state) => {
      if (state === StageConnectionState.DISCONNECTED) {
        if (participantInfo.current.isHost) {
          // Provide userData.channelId as fallback for the scenario that host decides to create a stage and exits quickly after
          const hostChannelId =
            participantInfo?.current?.hostChannelId || userData?.channelId;

          await stagesAPI.sendHostDisconnectedMessage(hostChannelId);

          participantInfo.current = {
            isHost: false,
            hostChannelId: null
          };
        }
      }

      if (state === StageConnectionState.ERRORED) {
        stageConnectionErroredEventCallback();
      }
    },
    [userData, stageConnectionErroredEventCallback]
  );

  const value = useMemo(
    () => ({
      // States
      participants,
      isSpectator,
      localScreenshareStream,
      isHost,
      isRequestedUserType,
      // Methods
      addParticipant,
      removeParticipant,
      resetParticipants,
      updateIsSpectator,
      updateParticipant,
      updateStreams,
      // Event Handlers
      participantEventHandlers: {
        handleParticipantJoinEvent,
        handleParticipantLeftEvent,
        handlePartipantStreamsAddedEvent,
        handleStreamMuteChangeEvent,
        handleParticipantPublishStateChangedEvent,
        handleParticipantConnectionChangedEvent
      }
    }),
    [
      participants,
      isSpectator,
      localScreenshareStream,
      isHost,
      isRequestedUserType,
      addParticipant,
      removeParticipant,
      resetParticipants,
      updateIsSpectator,
      updateParticipant,
      updateStreams,
      handleParticipantJoinEvent,
      handleParticipantLeftEvent,
      handlePartipantStreamsAddedEvent,
      handleStreamMuteChangeEvent,
      handleParticipantPublishStateChangedEvent,
      handleParticipantConnectionChangedEvent
    ]
  );

  return value;
};

export default useParticipants;
