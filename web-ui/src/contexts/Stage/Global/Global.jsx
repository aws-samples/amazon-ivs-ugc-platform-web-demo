import PropTypes from 'prop-types';
import { useAnimationControls } from 'framer-motion';
import { createContext, useMemo, useState } from 'react';

import useGlobalReducers from './useGlobalReducer';
import useContextHook from '../../useContextHook';
import { LOCAL_KEY } from './reducer/globalReducer';

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
    updateShouldAnimateGoLiveButtonChevronIcon,
    updateShouldDisableStageButtonWithDelay,
    updateStageId,
    updateStreams,
    updateSuccess,
    updateShouldCloseFullScreenViewOnHostLeave
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
    shouldCloseFullScreenViewOnHostLeave
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

  const value = useMemo(() => {
    return {
      // State
      error,
      isBlockingRoute,
      isChannelStagePlayerMuted,
      isCreatingStage,
      isSpectator,
      isStageActive,
      localParticipant,
      participants,
      stageId,
      strategy,
      success,
      shouldCloseFullScreenViewOnHostLeave,
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
      updateStageId,
      updateStreams,
      updateSuccess,
      updateShouldCloseFullScreenViewOnHostLeave,
      // Stage Animations
      animationCollapseStageControlsStart,
      collaborateButtonAnimationControls,
      updateAnimateCollapseStageContainerWithDelay,
      updateShouldAnimateGoLiveButtonChevronIcon,
      updateShouldDisableStageButtonWithDelay,
      animateCollapseStageContainerWithDelay,
      shouldAnimateGoLiveButtonChevronIcon,
      shouldDisableStageButtonWithDelay
    };
  }, [error, isBlockingRoute, isChannelStagePlayerMuted, isCreatingStage, isSpectator, isStageActive, localParticipant, participants, stageId, strategy, success, shouldCloseFullScreenViewOnHostLeave, addParticipant, creatingStage, removeParticipant, resetParticipants, resetStageState, toggleCameraState, toggleMicrophoneState, updateError, updateIsBlockingRoute, updateIsSpectator, updateParticipant, updateStageId, updateStreams, updateSuccess, updateShouldCloseFullScreenViewOnHostLeave, animationCollapseStageControlsStart, collaborateButtonAnimationControls, updateAnimateCollapseStageContainerWithDelay, updateShouldAnimateGoLiveButtonChevronIcon, updateShouldDisableStageButtonWithDelay, animateCollapseStageContainerWithDelay, shouldAnimateGoLiveButtonChevronIcon, shouldDisableStageButtonWithDelay]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useGlobal = () => useContextHook(Context);
