import { createContext, useMemo } from 'react';
import PropTypes from 'prop-types';

import { useAnimationControls } from 'framer-motion';

import useGlobalReducers from './useGlobalReducer';
import useContextHook from '../../useContextHook';
import { LOCAL_KEY, PARTICIPANT_TYPES } from './reducer/globalReducer';

const Context = createContext(null);
Context.displayName = 'Global';

export const ENABLE_LEAVE_SESSION_BUTTON_DELAY = 7000;

const { SubscribeType } = window.IVSBroadcastClient;

export const Provider = ({ children }) => {
  const {
    state,
    addParticipant,
    animationCollapseStageControlsStart,
    creatingStage,
    removeParticipant,
    resetParticipants,
    resetStageState,
    toggleCameraState,
    toggleMicrophoneState,
    updateAnimateCollapseStageContainerWithDelay,
    updateError,
    updateIsBlockingRoute,
    updateIsSpectator,
    updateParticipant,
    updateRequestingToJoinStage,
    updateShouldAnimateGoLiveButtonChevronIcon,
    updateShouldDisableStageButtonWithDelay,
    updateStageId,
    updateStreams,
    updateSuccess,
    updateShouldCloseFullScreenViewOnKickedOrHostLeave,
    updateHasStageRequestBeenApproved,
    updateStageRequestList,
    deleteRequestToJoin,
    updateIsChannelStagePlayerMuted,
    updateIsScreensharing,
    updateIsJoiningStageByRequest,
    updateIsJoiningStageByInvite,
    updateSpectatorParticipantId,
    updateShouldOpenSettingsModal
  } = useGlobalReducers();

  const {
    participants,
    stageId,
    isSpectator,
    animateCollapseStageContainerWithDelay,
    shouldAnimateGoLiveButtonChevronIcon,
    shouldDisableStageButtonWithDelay,
    isCreatingStage,
    error,
    success,
    isBlockingRoute,
    isChannelStagePlayerMuted,
    shouldCloseFullScreenViewOnKickedOrHostLeave,
    requestingToJoinStage,
    hasStageRequestBeenApproved,
    stageRequestList,
    isScreensharing,
    isJoiningStageByRequest,
    isJoiningStageByInvite,
    spectatorParticipantId,
    shouldOpenSettingsModal
  } = state;
  const localParticipant = participants.get(LOCAL_KEY);
  const collaborateButtonAnimationControls = useAnimationControls();
  const isStageActive = !!stageId;

  const strategy = useMemo(
    () => ({
      audioTrack: undefined,
      videoTrack: undefined,

      updateTracks(newAudioTrack, newVideoTrack) {
        this.audioTrack = newAudioTrack;
        this.videoTrack = newVideoTrack;
      },

      stageStreamsToPublish() {
        return [this.audioTrack, this.videoTrack];
      },

      shouldPublishParticipant(participant) {
        return true;
      },

      shouldSubscribeToParticipant(participant) {
        return SubscribeType.AUDIO_VIDEO;
      },

      stopTracks() {
        this.audioTrack?.mediaStreamTrack.stop();
        this.videoTrack?.mediaStreamTrack.stop();
      }
    }),
    []
  );

  const screenshareStrategy = useMemo(
    () => ({
      stream: null,

      stageStreamsToPublish() {
        return [this.stream];
      },
      shouldPublishParticipant: (participant) => {
        return true;
      },
      shouldSubscribeToParticipant: (participant) => {
        return SubscribeType.AUDIO_VIDEO;
      },
      setStream(stream) {
        this.stream = stream;
      },
      resetStrategy() {
        this.stream = null;
      }
    }),
    []
  );

  const { type = undefined } = localParticipant?.attributes || {};
  const isHost = type === PARTICIPANT_TYPES.HOST;
  const isInvitedParticipant = type === PARTICIPANT_TYPES.INVITED;

  const participantsArrayExcludingHost = useMemo(
    () =>
      [...participants].filter(
        ([_, participant]) =>
          participant.attributes.type !== PARTICIPANT_TYPES.HOST
      ),
    [participants]
  );

  const numberOfActiveScreenshares = useMemo(
    () =>
      [...participants].filter(
        ([_, participant]) =>
          participant.attributes.type === PARTICIPANT_TYPES.SCREENSHARE
      ).length,
    [participants]
  );

  const shouldDisableScreenshareButton =
    (numberOfActiveScreenshares >= 2 || participants.size >= 12) &&
    !isScreensharing;
  const isJoiningStageByRequestOrInvite =
    isJoiningStageByRequest || isJoiningStageByInvite;

  const value = useMemo(() => {
    return {
      // State
      error,
      hasStageRequestBeenApproved,
      isBlockingRoute,
      isChannelStagePlayerMuted,
      isCreatingStage,
      isSpectator,
      isStageActive,
      localParticipant,
      participants,
      participantsArrayExcludingHost,
      shouldDisableScreenshareButton,
      isScreensharing,
      requestingToJoinStage,
      stageId,
      strategy,
      success,
      isHost,
      isInvitedParticipant,
      shouldCloseFullScreenViewOnKickedOrHostLeave,
      updateIsChannelStagePlayerMuted,
      updateIsScreensharing,
      updateIsJoiningStageByRequest,
      isJoiningStageByRequest,
      updateIsJoiningStageByInvite,
      isJoiningStageByInvite,
      isJoiningStageByRequestOrInvite,
      updateSpectatorParticipantId,
      spectatorParticipantId,
      shouldOpenSettingsModal,
      updateShouldOpenSettingsModal,
      // Actions
      addParticipant,
      creatingStage,
      removeParticipant,
      resetParticipants,
      resetStageState,
      toggleCameraState,
      toggleMicrophoneState,
      updateError,
      updateIsBlockingRoute,
      updateIsSpectator,
      updateParticipant,
      updateRequestingToJoinStage,
      updateStageId,
      updateStreams,
      updateSuccess,
      updateShouldCloseFullScreenViewOnKickedOrHostLeave,
      updateHasStageRequestBeenApproved,
      // Stage Animations
      animationCollapseStageControlsStart,
      collaborateButtonAnimationControls,
      updateAnimateCollapseStageContainerWithDelay,
      updateShouldAnimateGoLiveButtonChevronIcon,
      updateShouldDisableStageButtonWithDelay,
      animateCollapseStageContainerWithDelay,
      shouldAnimateGoLiveButtonChevronIcon,
      shouldDisableStageButtonWithDelay,
      updateStageRequestList,
      stageRequestList,
      deleteRequestToJoin,
      screenshareStrategy
    };
  }, [
    error,
    hasStageRequestBeenApproved,
    isBlockingRoute,
    isChannelStagePlayerMuted,
    isCreatingStage,
    isSpectator,
    isStageActive,
    localParticipant,
    participants,
    participantsArrayExcludingHost,
    shouldDisableScreenshareButton,
    isScreensharing,
    requestingToJoinStage,
    stageId,
    strategy,
    updateIsScreensharing,
    success,
    shouldCloseFullScreenViewOnKickedOrHostLeave,
    updateIsChannelStagePlayerMuted,
    addParticipant,
    creatingStage,
    removeParticipant,
    resetParticipants,
    resetStageState,
    toggleCameraState,
    toggleMicrophoneState,
    updateError,
    updateHasStageRequestBeenApproved,
    updateIsBlockingRoute,
    updateIsSpectator,
    updateParticipant,
    updateShouldAnimateGoLiveButtonChevronIcon,
    updateShouldDisableStageButtonWithDelay,
    isHost,
    isInvitedParticipant,
    updateRequestingToJoinStage,
    updateStageId,
    updateStreams,
    updateSuccess,
    updateShouldCloseFullScreenViewOnKickedOrHostLeave,
    animationCollapseStageControlsStart,
    collaborateButtonAnimationControls,
    updateAnimateCollapseStageContainerWithDelay,
    animateCollapseStageContainerWithDelay,
    shouldAnimateGoLiveButtonChevronIcon,
    shouldDisableStageButtonWithDelay,
    updateStageRequestList,
    stageRequestList,
    deleteRequestToJoin,
    screenshareStrategy,
    updateIsJoiningStageByRequest,
    isJoiningStageByRequest,
    updateIsJoiningStageByInvite,
    isJoiningStageByInvite,
    isJoiningStageByRequestOrInvite,
    updateSpectatorParticipantId,
    spectatorParticipantId,
    shouldOpenSettingsModal,
    updateShouldOpenSettingsModal
  ]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useGlobal = () => useContextHook(Context);
