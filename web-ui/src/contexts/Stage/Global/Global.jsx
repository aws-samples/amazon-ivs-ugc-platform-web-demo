import PropTypes from 'prop-types';
import { useAnimationControls } from 'framer-motion';
import { createContext, useMemo } from 'react';

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
    updateSuccess
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
    isBlockingRoute
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
      isCreatingStage,
      isSpectator,
      isStageActive,
      localParticipant,
      participants,
      stageId,
      strategy,
      success,
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
  }, [
    creatingStage,
    error,
    isBlockingRoute,
    isCreatingStage,
    isSpectator,
    isStageActive,
    localParticipant,
    participants,
    stageId,
    addParticipant,
    removeParticipant,
    resetParticipants,
    resetStageState,
    strategy,
    success,
    toggleCameraState,
    toggleMicrophoneState,
    updateError,
    updateIsBlockingRoute,
    updateIsSpectator,
    updateParticipant,
    updateStageId,
    updateStreams,
    updateSuccess,
    animationCollapseStageControlsStart,
    collaborateButtonAnimationControls,
    updateAnimateCollapseStageContainerWithDelay,
    updateShouldAnimateGoLiveButtonChevronIcon,
    updateShouldDisableStageButtonWithDelay,
    animateCollapseStageContainerWithDelay,
    shouldAnimateGoLiveButtonChevronIcon,
    shouldDisableStageButtonWithDelay
  ]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useGlobal = () => useContextHook(Context);
