import { createSlice } from '@reduxjs/toolkit';
import { FULLSCREEN_ANIMATION_DURATION } from '../constants';

const GO_LIVE_ANIMATION_DELAY = 500;

const STREAM_MODES = {
  LOW_LATENCY: 'lowLatency',
  REAL_TIME: 'realTime'
};

const COLLABORATE_BUTTON_ANIM_DEFAULT = {
  zIndex: 0,
  opacity: 0
};

const TAB_INDEX = {
  MANAGE_STREAM: 0, // Default index
  GO_LIVE: 1
};

const INITIAL_STATE = {
  streamMode: STREAM_MODES.LOW_LATENCY,
  tabIndex: 0,
  stageJoinTime: null,
  fullscreen: {
    isOpen: false,
    isCollaborateButtonVisible: true,
    animateIn: true,
    animate: true,
    isAnimating: false
  },
  goLiveContainer: {
    isOpen: false,
    isExpandButtonVisible: true,
    animateGoLiveButtonChevronIcon: false,
    delayAnimation: false
  },
  animationInitialPos: {
    fullscreenWidth: 0,
    fullscreenHeight: 0,
    fullscreenLeft: 0,
    fullscreenTop: 0,
    goLiveButtonWidth: 0,
    broadcastControllerMarginLeft: 0
  },
  collaborateButtonAnimation: COLLABORATE_BUTTON_ANIM_DEFAULT,
  userMedia: {
    shouldUpdate: false
  },
  displayMedia: {
    isScreenSharing: false,
    shouldUnpublish: false,
    participantId: null
  }
};

export const streamManagerSlice = createSlice({
  name: 'streamManager',
  initialState: INITIAL_STATE,
  reducers: {
    resetStreamManagerStates: () => {
      return INITIAL_STATE;
    },
    updateStreamMode: (state, action) => {
      if (Object.values(STREAM_MODES).includes(action.payload)) {
        state.streamMode = action.payload;
      }
    },
    updateTabIndex: (state, action) => {
      if (Number.isInteger(action.payload)) {
        state.tabIndex = action.payload;
      } else {
        console.error(
          '[streamManager/updateTabIndex] payload is not an integer: ',
          action.payload
        );
      }
    },
    updateStageJoinTime: (state, action) => {
      state.stageJoinTime = action.payload || new Date().toISOString();
    },
    updateFullscreenStates: (state, action) => {
      state.fullscreen = {
        ...state.fullscreen,
        ...action.payload
      };
    },
    updateGoLiveContainerStates: (state, action) => {
      state.goLiveContainer = {
        ...state.goLiveContainer,
        ...action.payload
      };
    },
    updateShouldAnimateFullscreenIn: (state, action) => {
      state.shouldAnimateFullscreenIn = action.payload;
    },
    updateAnimationInitialStates: (state, action) => {
      state.animationInitialPos = {
        ...state.animationInitialPos,
        ...action.payload
      };
    },
    updateCollaborateButtonAnimations: (state, action) => {
      state.collaborateButtonAnimation = {
        ...state.collaborateButtonAnimation,
        ...action.payload
      };
    },
    updateUserMediaStates: (state, action) => {
      state.userMedia = {
        ...state.userMedia,
        ...action.payload
      };
    },
    updateDisplayMediaStates: (state, action) => {
      state.displayMedia = {
        ...state.displayMedia,
        ...action.payload
      };
    }
  }
});

const initializeFullscreenOpen = () => (dispatch, getState) => {
  const state = getState();
  if (state.streamManager.fullscreen.isOpen) return;

  dispatch(
    streamManagerSlice.actions.updateCollaborateButtonAnimations(
      COLLABORATE_BUTTON_ANIM_DEFAULT
    )
  );
  dispatch(
    streamManagerSlice.actions.updateGoLiveContainerStates({
      isOpen: true
    })
  );

  if (!state.streamManager.fullscreen.animate) {
    dispatch(
      streamManagerSlice.actions.updateFullscreenStates({
        animate: true
      })
    );
  }
  if (state.streamManager.streamMode === STREAM_MODES.LOW_LATENCY) {
    dispatch(
      streamManagerSlice.actions.updateFullscreenStates({
        isCollaborateButtonVisible: true
      })
    );
  }

  dispatch(streamManagerSlice.actions.updateFullscreenStates({ isOpen: true }));
};

const initializeFullscreenClose = () => (dispatch, getState) => {
  const state = getState();
  if (!state.streamManager.fullscreen.isOpen) return;

  dispatch(
    streamManagerSlice.actions.updateGoLiveContainerStates({
      isOpen: true
    })
  );
  dispatch(
    streamManagerSlice.actions.updateCollaborateButtonAnimations({
      opacity: 1,
      zIndex: 'unset'
    })
  );

  if (state.streamManager.streamMode === STREAM_MODES.REAL_TIME) {
    dispatch(
      streamManagerSlice.actions.updateGoLiveContainerStates({
        animateGoLiveButtonChevronIcon: true
      })
    );

    setTimeout(() => {
      dispatch(
        streamManagerSlice.actions.updateGoLiveContainerStates({
          delayAnimation: true
        })
      );
    }, GO_LIVE_ANIMATION_DELAY);
  } else {
    setTimeout(() => {
      dispatch(
        streamManagerSlice.actions.updateFullscreenStates({
          isCollaborateButtonVisible: false
        })
      );
    }, FULLSCREEN_ANIMATION_DURATION * 1000);
  }

  dispatch(
    streamManagerSlice.actions.updateFullscreenStates({ isOpen: false })
  );
};

const switchTabAndUpdateState = (tabIndex) => (dispatch) => {
  if (!Number.isInteger(tabIndex)) {
    console.error(
      '[streamManager/switchTabAndUpdateState] payload is not an integer: ',
      tabIndex
    );
    return;
  }

  dispatch(
    streamManagerSlice.actions.updateGoLiveContainerStates({
      isExpandButtonVisible: false
    })
  );
  dispatch(streamManagerSlice.actions.updateTabIndex(tabIndex));

  dispatch(
    streamManagerSlice.actions.updateGoLiveContainerStates({
      isOpen: tabIndex === TAB_INDEX.GO_LIVE
    })
  );
};

export const {
  resetStreamManagerStates,
  updateAnimationInitialStates,
  updateFullscreenStates,
  updateGoLiveContainerStates,
  updateStreamMode,
  updateTabIndex,
  updateUserMediaStates,
  updateDisplayMediaStates,
  updateStageJoinTime
} = streamManagerSlice.actions;
export {
  initializeFullscreenOpen,
  initializeFullscreenClose,
  switchTabAndUpdateState,
  STREAM_MODES,
  TAB_INDEX
};
export default streamManagerSlice.reducer;
