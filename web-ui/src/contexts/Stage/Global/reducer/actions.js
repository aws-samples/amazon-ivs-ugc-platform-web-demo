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

export const updateIsScreensharing = (bool) => ({
  type: actionTypes.UPDATE_IS_SCREEN_SHARING,
  payload: bool
});

export const updateShouldOpenSettingsModal = (bool) => ({
  type: actionTypes.UPDATE_SHOULD_OPEN_SETTINGS_MODAL,
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

export const updateShouldCloseFullScreenViewOnConnectionError = (bool) => ({
  type: actionTypes.UPDATE_SHOULD_CLOSE_FULL_SCREEN_VIEW_ON_CONNECTION_ERROR,
  payload: bool
});

export const updateRequestingToJoinStage = (bool) => ({
  type: actionTypes.UPDATE_REQUESTING_TO_JOIN_STAGE,
  payload: bool
});

export const updateHasStageRequestBeenApproved = (bool) => ({
  type: actionTypes.UPDATE_HAS_STAGE_REQUEST_BEEN_APPROVED,
  payload: bool
});

export const updateStageRequestList = (channelEvent) => ({
  type: actionTypes.UPDATE_STAGE_REQUEST_LIST,
  payload: channelEvent
});

export const deleteRequestToJoin = (requesteeChannelId) => ({
  type: actionTypes.DELETE_REQUEST_TO_JOIN,
  payload: requesteeChannelId
});

export const updateIsJoiningStageByRequest = (bool) => ({
  type: actionTypes.IS_JOINING_STAGE_BY_REQUEST,
  payload: bool
});

export const updateIsJoiningStageByInvite = (bool) => ({
  type: actionTypes.IS_JOINING_STAGE_BY_INVITE,
  payload: bool
});

// Real-time screenshare
export const updateLocalScreenshareStream = (stream) => ({
  type: actionTypes.UPDATE_LOCAL_SCREEN_SHARE_STREAM,
  payload: stream
});

export const updateIsScreensharePermissionRevoked = (bool) => ({
  type: actionTypes.UPDATE_IS_SCREEN_SHARE_PERMISSION_REVOKED,
  payload: bool
});

// Channel page
export const updateIsChannelStagePlayerMuted = (bool) => ({
  type: actionTypes.UPDATE_IS_CHANNEL_STAGE_PLAYER_MUTED,
  payload: bool
});
