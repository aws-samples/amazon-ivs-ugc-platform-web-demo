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
    updateShouldOpenSettingsModal,
    updateIsScreensharePermissionRevoked,
    updateLocalScreenshareStream
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
    shouldOpenSettingsModal,
    isScreensharePermissionRevoked,
    localScreenshareStream
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
      videoTrack: null,

      stageStreamsToPublish() {
        return [this.videoTrack];
      },
      shouldPublishParticipant: (participant) => {
        return true;
      },
      shouldSubscribeToParticipant: (participant) => {
        return SubscribeType.AUDIO_VIDEO;
      },
      setStream(videoTrack) {
        this.videoTrack = videoTrack;
      },
      resetStrategy() {
        this.videoTrack = null;
      },
      stopTracks() {
        this.videoTrack?.mediaStreamTrack.stop();
      }
    }),
    []
  );

  const { type = undefined } = localParticipant?.attributes || {};
  const isHost = type === PARTICIPANT_TYPES.HOST;
  const isInvitedParticipant = type === PARTICIPANT_TYPES.INVITED;

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
      isHost,
      isInvitedParticipant,
      isJoiningStageByInvite,
      isJoiningStageByRequest,
      isJoiningStageByRequestOrInvite,
      isScreensharePermissionRevoked,
      isScreensharing,
      isSpectator,
      isStageActive,
      localParticipant,
      localScreenshareStream,
      participants,
      requestingToJoinStage,
      shouldCloseFullScreenViewOnKickedOrHostLeave,
      shouldDisableScreenshareButton,
      shouldOpenSettingsModal,
      spectatorParticipantId,
      stageId,
      strategy,
      success,
      updateIsChannelStagePlayerMuted,
      updateIsJoiningStageByInvite,
      updateIsJoiningStageByRequest,
      updateIsScreensharePermissionRevoked,
      updateIsScreensharing,
      updateShouldOpenSettingsModal,
      updateSpectatorParticipantId,
      // Actions
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
      updateLocalScreenshareStream,
      updateParticipant,
      updateRequestingToJoinStage,
      updateShouldCloseFullScreenViewOnKickedOrHostLeave,
      updateStageId,
      updateStreams,
      updateSuccess,
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
    addParticipant,
    animateCollapseStageContainerWithDelay,
    animationCollapseStageControlsStart,
    collaborateButtonAnimationControls,
    creatingStage,
    deleteRequestToJoin,
    error,
    hasStageRequestBeenApproved,
    isBlockingRoute,
    isChannelStagePlayerMuted,
    isCreatingStage,
    isHost,
    isInvitedParticipant,
    isJoiningStageByInvite,
    isJoiningStageByRequest,
    isJoiningStageByRequestOrInvite,
    isScreensharePermissionRevoked,
    isScreensharing,
    isSpectator,
    isStageActive,
    localParticipant,
    localScreenshareStream,
    participants,
    removeParticipant,
    requestingToJoinStage,
    resetParticipants,
    resetStageState,
    screenshareStrategy,
    shouldAnimateGoLiveButtonChevronIcon,
    shouldCloseFullScreenViewOnKickedOrHostLeave,
    shouldDisableScreenshareButton,
    shouldDisableStageButtonWithDelay,
    shouldOpenSettingsModal,
    spectatorParticipantId,
    stageId,
    stageRequestList,
    strategy,
    success,
    toggleCameraState,
    toggleMicrophoneState,
    updateAnimateCollapseStageContainerWithDelay,
    updateError,
    updateHasStageRequestBeenApproved,
    updateIsBlockingRoute,
    updateIsChannelStagePlayerMuted,
    updateIsJoiningStageByInvite,
    updateIsJoiningStageByRequest,
    updateIsScreensharePermissionRevoked,
    updateIsScreensharing,
    updateIsSpectator,
    updateLocalScreenshareStream,
    updateParticipant,
    updateRequestingToJoinStage,
    updateShouldAnimateGoLiveButtonChevronIcon,
    updateShouldCloseFullScreenViewOnKickedOrHostLeave,
    updateShouldDisableStageButtonWithDelay,
    updateShouldOpenSettingsModal,
    updateSpectatorParticipantId,
    updateStageId,
    updateStageRequestList,
    updateStreams,
    updateSuccess
  ]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useGlobal = () => useContextHook(Context);
