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
  UPDATE_SHOULD_CLOSE_FULL_SCREEN_VIEW_ON_HOST_LEAVE: 'UPDATE_SHOULD_CLOSE_FULL_SCREEN_VIEW_ON_HOST_LEAVE',
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
  // Channel page
  UPDATE_IS_CHANNEL_STAGE_PLAYER_MUTED: 'UPDATE_IS_CHANNEL_STAGE_PLAYER_MUTED'
};

export default actionTypes;
