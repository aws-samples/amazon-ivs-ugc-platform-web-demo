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

import actionTypes from './actionTypes';

export const LOCAL_KEY = 'LOCAL';
export const PARTICIPANT_TYPES = {
  HOST: 'host',
  INVITED: 'invited'
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
  IS_CHANNEL_STAGE_PLAYER_MUTED: 'isChannelStagePlayerMuted'
};

const defaultStageReducerState = {
  [STATE_KEYS.PARTICIPANTS]: new Map(),
  [STATE_KEYS.IS_SPECTATOR]: false,
  [STATE_KEYS.STAGE_ID]: null,
  [STATE_KEYS.IS_CREATING_STAGE]: false,
  [STATE_KEYS.SUCCESS]: null,
  [STATE_KEYS.ERROR]: null,
  [STATE_KEYS.IS_BLOCKING_ROUTE]: false,
  [STATE_KEYS.IS_CHANNEL_STAGE_PLAYER_MUTED]: true
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

      return {
        ...state,
        [STATE_KEYS.PARTICIPANTS]: currentParticipants
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
        participants: defaultStageReducerState.participants
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

    default:
      return state;
  }
};

export default globalReducer;
