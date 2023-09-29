import actionTypes from './actionTypes';

export const resetStageState = (propertiesToOmit = []) => ({
  type: actionTypes.RESET_STAGE_STATE,
  payload: propertiesToOmit
});

export const creatingStage = (isCreating) => ({
  type: actionTypes.CREATING_STAGE,
  payload: isCreating
});

export const updateError = (error) => ({
  type: actionTypes.UPDATE_ERROR,
  payload: error
});

export const updateSuccess = (msg) => ({
  type: actionTypes.UPDATE_SUCCESS,
  payload: msg
});

export const updateStageId = (stageId) => ({
  type: actionTypes.UPDATE_STAGE_ID,
  payload: stageId
});

export const updateAnimateCollapseStageContainerWithDelay = (
  shouldAnimate
) => ({
  type: actionTypes.UPDATE_ANIMATE_COLLAPSE_STAGE_CONTAINER_WITH_DELAY,
  payload: shouldAnimate
});

export const updateShouldAnimateGoLiveButtonChevronIcon = (shouldAnimate) => ({
  type: actionTypes.UPDATE_ANIMATE_GO_LIVE_BUTTON_CHEVRON_ICON,
  payload: shouldAnimate
});

export const updateShouldDisableStageButtonWithDelay = (
  shouldDisableStageButtonWithDelay
) => ({
  type: actionTypes.UPDATE_SHOULD_DISABLE_STAGE_BUTTON_WITH_DELAY,
  payload: shouldDisableStageButtonWithDelay
});

// Participants
export const updateStreams = (key, streams) => ({
  type: actionTypes.UPDATE_PARTICIPANT_STREAMS,
  payload: { key, streams }
});

export const addParticipant = (participant) => ({
  type: actionTypes.ADD_PARTICIPANT,
  payload: participant
});

export const removeParticipant = (userId) => ({
  type: actionTypes.REMOVE_PARTICIPANT,
  payload: userId
});

export const updateParticipant = (key, participant) => ({
  type: actionTypes.UPDATE_PARTICIPANT,
  payload: { key, participant }
});

export const toggleCameraState = (key, isCameraHidden = null) => ({
  type: actionTypes.TOGGLE_PARTICIPANT_CAMERA,
  payload: { key, isCameraHidden }
});

export const toggleMicrophoneState = (key, isMuted = null) => ({
  type: actionTypes.TOGGLE_PARTICIPANT_MICROPHONE,
  payload: { key, isMuted }
});

export const updateIsBlockingRoute = (bool) => ({
  type: actionTypes.UPDATE_IS_BLOCKING_ROUTE,
  payload: bool
});

export const updateIsSpectator = (bool) => ({
  type: actionTypes.UPDATE_IS_SPECTATOR,
  payload: bool
});
