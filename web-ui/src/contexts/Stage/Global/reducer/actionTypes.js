const actionTypes = {
  RESET_STAGE_STATE: 'RESET_STAGE_STATE',
  UPDATE_STAGE_ID: 'UPDATE_STAGE_ID',
  CREATING_STAGE: 'CREATING_STAGE',
  UPDATE_ANIMATE_COLLAPSE_STAGE_CONTAINER_WITH_DELAY:
    'UPDATE_ANIMATE_COLLAPSE_STAGE_CONTAINER_WITH_DELAY',
  UPDATE_ANIMATE_GO_LIVE_BUTTON_CHEVRON_ICON:
    'UPDATE_ANIMATE_GO_LIVE_BUTTON_CHEVRON_ICON',
  UPDATE_IS_SPECTATOR: 'UPDATE_IS_SPECTATOR',
  UPDATE_ERROR: 'UPDATE_ERROR',
  UPDATE_SUCCESS: 'UPDATE_SUCCESS',
  UPDATE_IS_BLOCKING_ROUTE: 'UPDATE_IS_BLOCKING_ROUTE',
  UPDATE_IS_SCREEN_SHARING: 'UPDATE_IS_SCREEN_SHARING',
  UPDATE_SHOULD_CLOSE_FULL_SCREEN_VIEW_ON_KICKED_OR_HOST_LEAVE:
    'UPDATE_SHOULD_CLOSE_FULL_SCREEN_VIEW_ON_KICKED_OR_HOST_LEAVE',
  UPDATE_REQUESTING_TO_JOIN_STAGE: 'UPDATE_REQUESTING_TO_JOIN_STAGE',
  UPDATE_HAS_STAGE_REQUEST_BEEN_APPROVED:
    'UPDATE_HAS_STAGE_REQUEST_BEEN_APPROVED',
  // Participants
  ADD_PARTICIPANT: 'ADD_PARTICIPANT',
  REMOVE_PARTICIPANT: 'REMOVE_PARTICIPANT',
  UPDATE_PARTICIPANT: 'UPDATE_PARTICIPANT',
  TOGGLE_PARTICIPANT_CAMERA: 'TOGGLE_PARTICIPANT_CAMERA',
  TOGGLE_PARTICIPANT_MICROPHONE: 'TOGGLE_PARTICIPANT_MICROPHONE',
  UPDATE_PARTICIPANT_STREAMS: 'UPDATE_PARTICIPANT_STREAMS',
  UPDATE_SHOULD_DISABLE_STAGE_BUTTON_WITH_DELAY:
    'UPDATE_SHOULD_DISABLE_STAGE_BUTTON_WITH_DELAY',
  RESET_PARTICIPANTS: 'RESET_PARTICIPANTS',
  // Real-time screenshare
  UPDATE_LOCAL_SCREEN_SHARE_STREAM: 'UPDATE_LOCAL_SCREEN_SHARE_STREAM',
  UPDATE_IS_SCREEN_SHARE_PREMISSION_REVOKE:
    'UPDATE_IS_SCREEN_SHARE_PREMISSION_REVOKE',
  // Channel page
  UPDATE_IS_CHANNEL_STAGE_PLAYER_MUTED: 'UPDATE_IS_CHANNEL_STAGE_PLAYER_MUTED',
  UPDATE_STAGE_REQUEST_LIST: 'UPDATE_STAGE_REQUEST_LIST',
  DELETE_REQUEST_TO_JOIN: 'DELETE_REQUEST_TO_JOIN',
  IS_JOINING_STAGE_BY_REQUEST: 'IS_JOINING_STAGE_BY_REQUEST',
  IS_JOINING_STAGE_BY_INVITE: 'IS_JOINING_STAGE_BY_INVITE',
  UPDATE_SPECTATOR_PARTICIPANT_ID: 'UPDATE_SPECTATOR_PARTICIPANT_ID',
  UPDATE_SHOULD_OPEN_SETTINGS_MODAL: 'UPDATE_SHOULD_OPEN_SETTINGS_MODAL'
};

export default actionTypes;
