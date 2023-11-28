/**
 * @typedef {Object} ParticipantAttributes
 * @property {string} avatar
 * @property {string} color
 * @property {string} displayName
 *
 * @typedef {Map} Participant
 * @property {Boolean} isCameraHidden
 * @property {Boolean} isLocal
 * @property {Boolean} isMicrophoneMuted
 * @property {MediaStreamTrack[]} streams
 * @property {ParticipantAttributes} attributes
 * @property {String} userId

 *
 * @typedef {Map<Participant>} Participants
 */

import channelEvents from '../../../AppSync/channelEvents';
import actionTypes from './actionTypes';

const updateStageRequestToJoin = (
  participantChanneId,
  stageRequestToJoinList
) => {
  let currentStageRequestToJoinList = [...stageRequestToJoinList];

  const hasUserRequestedToJoin = !!stageRequestToJoinList.find(
    (requestee) =>
      requestee.channelId.toLowerCase() === participantChanneId.toLowerCase()
  );

  if (hasUserRequestedToJoin) {
    currentStageRequestToJoinList = currentStageRequestToJoinList.filter(
      (requestee) => requestee.channelId !== participantChanneId.toLowerCase()
    );
  }

  return currentStageRequestToJoinList;
};

export const LOCAL_KEY = 'LOCAL';
export const PARTICIPANT_TYPES = {
  HOST: 'host',
  INVITED: 'invited',
  REQUESTED: 'requested',
  SPECTATOR: 'spectator',
  SCREENSHARE: 'screenshare'
};

export const defaultParticipant = {
  isMicrophoneMuted: false,
  isCameraHidden: false,
  isLocal: false,
  attributes: {
    avatar: '',
    profileColor: '',
    username: '',
    participantTokenCreationDate: undefined
  },
  userId: '',
  streams: null
};

export const STATE_KEYS = {
  PARTICIPANTS: 'participants',
  IS_SPECTATOR: 'isSpectator',
  IS_CREATING_STAGE: 'isCreatingStage',
  STAGE_ID: 'stageId',
  ANIMATE_COLLAPSE_STAGE_CONTAINER_WITH_DELAY:
    'animateCollapseStageContainerWithDelay',
  SHOULD_ANIMATE_GO_LIVE_BUTTON_CHEVRON_ICON:
    'shouldAnimateGoLiveButtonChevronIcon',
  SHOULD_DISABLE_STAGE_BUTTON_WITH_DELAY: 'shouldDisableStageButtonWithDelay',
  SUCCESS: 'success',
  ERROR: 'error',
  IS_BLOCKING_ROUTE: 'isBlockingRoute',
  IS_CHANNEL_STAGE_PLAYER_MUTED: 'isChannelStagePlayerMuted',
  IS_SCREEN_SHARING: 'isScreensharing',
  LOCAL_SCREEN_SHARE_STREAM: 'localScreenshareStream',
  SHOULD_CLOSE_FULL_SCREEN_VIEW_ON_KICKED_OR_HOST_LEAVE:
    'shouldCloseFullScreenViewOnKickedOrHostLeave',
  REQUESTING_TO_JOIN_STAGE: 'requestingToJoinStage',
  HAS_STAGE_REQUEST_BEEN_APPROVED: 'hasStageRequestBeenApproved',
  STAGE_REQUEST_LIST: 'stageRequestList',
  IS_JOINING_STAGE_BY_REQUEST: 'isJoiningStageByRequest',
  IS_JOINING_STAGE_BY_INVITE: 'isJoiningStageByInvite',
  SPECTATOR_PARTICIPANT_ID: 'spectatorParticipantId',
  SHOULD_OPEN_SETTINGS_MODAL: 'shouldOpenSettingsModal',
  IS_SCREEN_SHARE_PREMISSION_REVOKE: 'isScreensharePermissionRevoked'
};

const defaultStageReducerState = {
  [STATE_KEYS.PARTICIPANTS]: new Map(),
  [STATE_KEYS.IS_SPECTATOR]: false,
  [STATE_KEYS.STAGE_ID]: null,
  [STATE_KEYS.IS_CREATING_STAGE]: false,
  [STATE_KEYS.SUCCESS]: null,
  [STATE_KEYS.ERROR]: null,
  [STATE_KEYS.IS_BLOCKING_ROUTE]: false,
  [STATE_KEYS.IS_SCREEN_SHARING]: false,
  [STATE_KEYS.IS_CHANNEL_STAGE_PLAYER_MUTED]: true,
  [STATE_KEYS.SHOULD_CLOSE_FULL_SCREEN_VIEW_ON_KICKED_OR_HOST_LEAVE]: false,
  [STATE_KEYS.LOCAL_SCREEN_SHARE_STREAM]: null,
  [STATE_KEYS.REQUESTING_TO_JOIN_STAGE]: false,
  [STATE_KEYS.HAS_STAGE_REQUEST_BEEN_APPROVED]: false,
  [STATE_KEYS.STAGE_REQUEST_LIST]: [],
  [STATE_KEYS.IS_JOINING_STAGE_BY_REQUEST]: false,
  [STATE_KEYS.IS_JOINING_STAGE_BY_INVITE]: false,
  [STATE_KEYS.SPECTATOR_PARTICIPANT_ID]: null,
  [STATE_KEYS.SHOULD_OPEN_SETTINGS_MODAL]: false,
  [STATE_KEYS.IS_SCREEN_SHARE_PREMISSION_REVOKE]: false
};

const stageAnimationReducerState = {
  [STATE_KEYS.ANIMATE_COLLAPSE_STAGE_CONTAINER_WITH_DELAY]: false,
  [STATE_KEYS.SHOULD_ANIMATE_GO_LIVE_BUTTON_CHEVRON_ICON]: false,
  [STATE_KEYS.SHOULD_DISABLE_STAGE_BUTTON_WITH_DELAY]: true
};

export const defaultReducerState = {
  ...defaultStageReducerState,
  ...stageAnimationReducerState
};

const globalReducer = (state = defaultReducerState, action) => {
  let currentStageRequestToJoinList = [...(state?.stageRequestList || [])];
  const currentParticipants = new Map(state.participants);
  let currentParticipant;

  switch (action.type) {
    case actionTypes.UPDATE_ERROR: {
      return {
        ...state,
        [STATE_KEYS.ERROR]: action.payload
      };
    }

    case actionTypes.UPDATE_SUCCESS: {
      return {
        ...state,
        [STATE_KEYS.SUCCESS]: action.payload
      };
    }

    case actionTypes.UPDATE_IS_BLOCKING_ROUTE: {
      return {
        ...state,
        [STATE_KEYS.IS_BLOCKING_ROUTE]: action.payload
      };
    }

    case actionTypes.RESET_STAGE_STATE: {
      const propertiesToOmit = action.payload;

      const propertiesToOmitArray =
        typeof propertiesToOmit === 'string'
          ? [propertiesToOmit]
          : propertiesToOmit || [];

      const statesToOmit = propertiesToOmitArray.reduce((acc, key) => {
        if (state[key] !== undefined) {
          acc[key] = state[key];
        }
        return acc;
      }, {});

      return { ...defaultStageReducerState, ...statesToOmit };
    }

    case actionTypes.CREATING_STAGE: {
      return {
        ...state,
        [STATE_KEYS.IS_CREATING_STAGE]: action.payload
      };
    }
    case actionTypes.UPDATE_STAGE_ID: {
      return {
        ...state,
        [STATE_KEYS.STAGE_ID]: action.payload
      };
    }
    case actionTypes.ADD_PARTICIPANT: {
      const { isLocal, userId } = action.payload;
      const newParticipantObject = {
        ...defaultParticipant,
        ...action.payload
      };
      currentParticipants.set(
        isLocal ? LOCAL_KEY : userId,
        newParticipantObject
      );

      const updatedStageRequestToJoinList = updateStageRequestToJoin(
        newParticipantObject.attributes.channelId,
        currentStageRequestToJoinList
      );

      return {
        ...state,
        [STATE_KEYS.PARTICIPANTS]: currentParticipants,
        [STATE_KEYS.STAGE_REQUEST_LIST]: updatedStageRequestToJoinList
      };
    }

    case actionTypes.REMOVE_PARTICIPANT: {
      const userId = action.payload;

      currentParticipants.delete(userId);

      return {
        ...state,
        [STATE_KEYS.PARTICIPANTS]: currentParticipants
      };
    }

    case actionTypes.UPDATE_PARTICIPANT: {
      const { key, participant } = action.payload;
      currentParticipant = currentParticipants.get(key);
      const newParticipantObject = {
        ...currentParticipant,
        ...participant
      };
      currentParticipants.set(key, newParticipantObject);

      return {
        ...state,
        [STATE_KEYS.PARTICIPANTS]: currentParticipants
      };
    }

    case actionTypes.UPDATE_PARTICIPANT_STREAMS: {
      const { key, streams } = action.payload;
      currentParticipant = currentParticipants.get(key);
      let isCameraHidden, isMicrophoneMuted;
      streams.forEach((stream) => {
        if (stream.streamType === 'video') {
          isCameraHidden = stream.isMuted;
        }
        if (stream.streamType === 'audio') {
          isMicrophoneMuted = stream.isMuted;
        }
      });

      // Stop previous local video track
      if (currentParticipant?.isLocal && currentParticipant?.streams?.length) {
        currentParticipant.streams[0].mediaStreamTrack.stop();
      }

      // Update participant's streams with no mutation
      currentParticipants.set(key, {
        ...currentParticipant,
        ...(!!isMicrophoneMuted && { isMicrophoneMuted }),
        ...(!!isCameraHidden && { isCameraHidden }),
        streams
      });

      return {
        ...state,
        [STATE_KEYS.PARTICIPANTS]: currentParticipants
      };
    }

    case actionTypes.TOGGLE_PARTICIPANT_CAMERA: {
      const { key, isCameraHidden = null } = action.payload;
      currentParticipant = currentParticipants.get(key);
      const shouldCameraBeHidden = !currentParticipant.isCameraHidden;

      if (!currentParticipant) return state;

      currentParticipants.set(key, {
        ...currentParticipant,
        isCameraHidden:
          typeof isCameraHidden === 'boolean'
            ? isCameraHidden
            : shouldCameraBeHidden
      });

      return {
        ...state,
        [STATE_KEYS.PARTICIPANTS]: currentParticipants
      };
    }

    case actionTypes.TOGGLE_PARTICIPANT_MICROPHONE: {
      const { key, isMuted = null } = action.payload;
      currentParticipant = currentParticipants.get(key);

      if (!currentParticipant) return state;

      currentParticipants.set(key, {
        ...currentParticipant,
        isMicrophoneMuted:
          typeof isMuted === 'boolean'
            ? isMuted
            : !currentParticipant.isMicrophoneMuted
      });

      return {
        ...state,
        [STATE_KEYS.PARTICIPANTS]: currentParticipants
      };
    }

    case actionTypes.UPDATE_IS_SPECTATOR: {
      const isSpectator = action.payload;

      if (isSpectator) {
        currentParticipants.delete(LOCAL_KEY);
      }

      return {
        ...state,
        [STATE_KEYS.IS_SPECTATOR]: action.payload,
        [STATE_KEYS.PARTICIPANTS]: currentParticipants
      };
    }

    case actionTypes.RESET_PARTICIPANTS: {
      return {
        ...state,
        [STATE_KEYS.PARTICIPANTS]: defaultStageReducerState.participants
      };
    }

    case actionTypes.UPDATE_ANIMATE_COLLAPSE_STAGE_CONTAINER_WITH_DELAY: {
      return {
        ...state,
        [STATE_KEYS.ANIMATE_COLLAPSE_STAGE_CONTAINER_WITH_DELAY]: action.payload
      };
    }

    case actionTypes.UPDATE_ANIMATE_GO_LIVE_BUTTON_CHEVRON_ICON: {
      return {
        ...state,
        [STATE_KEYS.SHOULD_ANIMATE_GO_LIVE_BUTTON_CHEVRON_ICON]: action.payload
      };
    }

    case actionTypes.UPDATE_SHOULD_DISABLE_STAGE_BUTTON_WITH_DELAY: {
      return {
        ...state,
        [STATE_KEYS.SHOULD_DISABLE_STAGE_BUTTON_WITH_DELAY]: action.payload
      };
    }

    case actionTypes.UPDATE_IS_CHANNEL_STAGE_PLAYER_MUTED: {
      return {
        ...state,
        [STATE_KEYS.IS_CHANNEL_STAGE_PLAYER_MUTED]: action.payload
      };
    }

    case actionTypes.UPDATE_SHOULD_CLOSE_FULL_SCREEN_VIEW_ON_KICKED_OR_HOST_LEAVE: {
      return {
        ...state,
        [STATE_KEYS.SHOULD_CLOSE_FULL_SCREEN_VIEW_ON_KICKED_OR_HOST_LEAVE]:
          action.payload
      };
    }

    case actionTypes.UPDATE_LOCAL_SCREEN_SHARE_STREAM: {
      return {
        ...state,
        [STATE_KEYS.LOCAL_SCREEN_SHARE_STREAM]: action.payload
      };
    }

    case actionTypes.UPDATE_REQUESTING_TO_JOIN_STAGE: {
      return {
        ...state,
        [STATE_KEYS.REQUESTING_TO_JOIN_STAGE]: action.payload
      };
    }

    case actionTypes.UPDATE_HAS_STAGE_REQUEST_BEEN_APPROVED: {
      return {
        ...state,
        [STATE_KEYS.HAS_STAGE_REQUEST_BEEN_APPROVED]: action.payload
      };
    }

    case actionTypes.UPDATE_STAGE_REQUEST_LIST: {
      const { type, channelId } = action.payload;

      if (type === channelEvents.STAGE_REQUEST_TO_JOIN) {
        currentStageRequestToJoinList = [
          action.payload,
          ...currentStageRequestToJoinList
        ];
      } else if (type === channelEvents.STAGE_REVOKE_REQUEST_TO_JOIN) {
        currentStageRequestToJoinList = currentStageRequestToJoinList.filter(
          (requestee) => requestee.channelId !== channelId.toLowerCase()
        );
      }

      return {
        ...state,
        [STATE_KEYS.STAGE_REQUEST_LIST]: currentStageRequestToJoinList
      };
    }

    case actionTypes.DELETE_REQUEST_TO_JOIN: {
      const channelId = action.payload;
      currentStageRequestToJoinList = currentStageRequestToJoinList.filter(
        (requestee) => requestee.channelId !== channelId
      );

      return {
        ...state,
        [STATE_KEYS.STAGE_REQUEST_LIST]: currentStageRequestToJoinList
      };
    }

    case actionTypes.UPDATE_IS_SCREEN_SHARING: {
      return {
        ...state,
        [STATE_KEYS.IS_SCREEN_SHARING]: action.payload
      };
    }

    case actionTypes.IS_JOINING_STAGE_BY_REQUEST: {
      return {
        ...state,
        [STATE_KEYS.IS_JOINING_STAGE_BY_REQUEST]: action.payload
      };
    }

    case actionTypes.IS_JOINING_STAGE_BY_INVITE: {
      return {
        ...state,
        [STATE_KEYS.IS_JOINING_STAGE_BY_INVITE]: action.payload
      };
    }

    case actionTypes.UPDATE_SPECTATOR_PARTICIPANT_ID: {
      return {
        ...state,
        [STATE_KEYS.SPECTATOR_PARTICIPANT_ID]: action.payload
      };
    }

    case actionTypes.UPDATE_SHOULD_OPEN_SETTINGS_MODAL: {
      return {
        ...state,
        [STATE_KEYS.SHOULD_OPEN_SETTINGS_MODAL]: action.payload
      };
    }

    case actionTypes.UPDATE_IS_SCREEN_SHARE_PREMISSION_REVOKE: {
      return {
        ...state,
        [STATE_KEYS.IS_SCREEN_SHARE_PREMISSION_REVOKE]: action.payload
      };
    }

    default:
      return state;
  }
};

export default globalReducer;
