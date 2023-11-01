import actionTypes from './actionTypes';

export const creatingStage = (isCreating) => ({
  type: actionTypes.CREATING_STAGE,
  payload: isCreating
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

export const resetStageState = (propertiesToOmit = []) => ({
  type: actionTypes.RESET_STAGE_STATE,
  payload: propertiesToOmit
});

export const updateError = (error) => ({
  type: actionTypes.UPDATE_ERROR,
  payload: error
});

export const updateSuccess = (msg) => ({
  type: actionTypes.UPDATE_SUCCESS,
  payload: msg
});

export const updateIsBlockingRoute = (bool) => ({
  type: actionTypes.UPDATE_IS_BLOCKING_ROUTE,
  payload: bool
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

export const updateIsSpectator = (bool) => ({
  type: actionTypes.UPDATE_IS_SPECTATOR,
  payload: bool
});

export const resetParticipants = () => ({
  type: actionTypes.RESET_PARTICIPANTS
});

export const updateShouldCloseFullScreenViewOnKickedOrHostLeave = (bool) => ({
  type: actionTypes.UPDATE_SHOULD_CLOSE_FULL_SCREEN_VIEW_ON_KICKED_OR_HOST_LEAVE,
  payload: bool
});

export const updateRequestingToJoinStage = (bool) => ({
  type: actionTypes.UPDATE_REQUESTING_TO_JOIN_STAGE,
  payload: bool
});

// Channel page
export const updateIsChannelStagePlayerMuted = (bool) => ({
  type: actionTypes.UPDATE_IS_CHANNEL_STAGE_PLAYER_MUTED,
  payload: bool
});
