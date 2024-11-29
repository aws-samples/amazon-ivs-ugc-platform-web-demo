import { createSlice } from '@reduxjs/toolkit';

import { streamManager as $streamManagerContent } from '../content';
import { STAGE_LEFT_REASONS } from '../constants';

const $streamManagerStageNotifications =
  $streamManagerContent.stream_manager_stage.notifications;

const COLLABORATE_HOST_STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected'
};

const COLLABORATE_DEFAULT = {
  isRequesting: false,
  isJoining: false,
  isLeaving: false,
  leftReason: null,
  participantType: '',
  stageId: '',
  requestList: [],
  host: { username: '', status: '' }
};

const INITIAL_STATE = {
  success: null,
  error: null,
  neutral: null,
  collaborate: COLLABORATE_DEFAULT
};

export const sharedSlice = createSlice({
  name: 'shared',
  initialState: INITIAL_STATE,
  reducers: {
    resetSharedStates: () => {
      return INITIAL_STATE;
    },
    updateError: (state, action) => {
      state.error = action.payload;
    },
    updateSuccess: (state, action) => {
      state.success = action.payload;
    },
    updateNeutral: (state, action) => {
      state.neutral = action.payload;
    },
    clearCollaborate: (state) => {
      state.collaborate = COLLABORATE_DEFAULT;
    },
    addToCollaborateRequestList: (state, action) => {
      state.collaborate.requestList = [
        ...state.collaborate.requestList,
        action.payload
      ];
    },
    removeFromCollaborateRequestList: (state, action) => {
      const channelId = action.payload;

      state.collaborate.requestList = state.collaborate.requestList.filter(
        (requestee) => requestee.channelId !== channelId.toLowerCase()
      );
    },
    updateCollaborateStates: (state, action) => {
      const revokingRequest =
        !action.payload.isJoining && action.payload.isRequesting === false;

      state.collaborate = {
        ...state.collaborate,
        // when isRequesting is true, joining must be false
        ...(action.payload.isRequesting && {
          isJoining: false
        }),
        ...(revokingRequest && {
          participantType: '',
          stageId: ''
        }),
        // when isJoining is true, isRequesting must be false
        ...(action.payload.isJoining && {
          isRequesting: false
        }),
        ...action.payload
      };
    },
    updateCollaborateHost: (state, action) => {
      state.collaborate.host = {
        ...state.collaborate.host,
        ...action.payload
      };
    }
  }
});

const finalizeCollaborationExit =
  (leftReason = null) =>
  (dispatch, getState) => {
    const state = getState();
    if (!state.shared.collaborate.isLeaving) return;

    switch (leftReason) {
      case STAGE_LEFT_REASONS.SESSION_ENDED:
      case STAGE_LEFT_REASONS.STAGE_DELETED:
        dispatch(
          updateNeutral(
            $streamManagerStageNotifications.neutral.the_session_ended
          )
        );
        break;

      case STAGE_LEFT_REASONS.PARTICIPANT_DISCONNECTED:
        dispatch(
          updateError(
            $streamManagerStageNotifications.error
              .you_have_been_removed_from_session
          )
        );
        break;

      case STAGE_LEFT_REASONS.FAILED_TO_JOIN:
        dispatch(
          updateError(
            $streamManagerStageNotifications.error.unable_to_join_session
          )
        );
        break;

      default:
        dispatch(
          updateSuccess(
            $streamManagerStageNotifications.success.you_have_left_the_session
          )
        );
        break;
    }

    dispatch(clearCollaborate());
  };

export const {
  addToCollaborateRequestList,
  clearCollaborate,
  removeFromCollaborateRequestList,
  resetSharedStates,
  updateCollaborateHost,
  updateCollaborateStates,
  updateError,
  updateSuccess,
  updateNeutral
} = sharedSlice.actions;
export {
  COLLABORATE_DEFAULT,
  COLLABORATE_HOST_STATUS,
  finalizeCollaborationExit
};
export default sharedSlice.reducer;
