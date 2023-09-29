import { useReducer, useMemo, useCallback } from 'react';

import { stageReducer, defaultStageReducerState, actions } from './reducer';

const useStageReducers = () => {
  const [state, dispatch] = useReducer(stageReducer, defaultStageReducerState);

  const addParticipant = useCallback((participantObj) => {
    dispatch(actions.addParticipant(participantObj));
  }, []);

  const removeParticipant = useCallback((userId) => {
    dispatch(actions.removeParticipant(userId));
  }, []);

  const updateParticipant = useCallback((key, participantObj) => {
    dispatch(actions.updateParticipant(key, participantObj));
  }, []);

  const creatingStage = useCallback((isCreating) => {
    dispatch(actions.creatingStage(isCreating));
  }, []);

  const updateAnimateCollapseStageContainerWithDelay = useCallback(
    (shouldAnimate) => {
      dispatch(
        actions.updateAnimateCollapseStageContainerWithDelay(shouldAnimate)
      );
    },
    []
  );

  const updateShouldAnimateGoLiveButtonChevronIcon = useCallback(
    (shouldAnimate) => {
      dispatch(
        actions.updateShouldAnimateGoLiveButtonChevronIcon(shouldAnimate)
      );
    },
    []
  );
  const updateShouldDisableStageButtonWithDelay = useCallback(
    (shouldDisableStageButtonWithDelay) => {
      dispatch(
        actions.updateShouldDisableStageButtonWithDelay(
          shouldDisableStageButtonWithDelay
        )
      );
    },
    []
  );

  const updateError = useCallback((error) => {
    dispatch(actions.updateError(error));
  }, []);

  const updateStageId = useCallback((stageId) => {
    dispatch(actions.updateStageId(stageId));
  }, []);

  const updateSuccess = useCallback((msg) => {
    dispatch(actions.updateSuccess(msg));
  }, []);

  const toggleCameraState = useCallback((key, isCameraHidden = null) => {
    dispatch(actions.toggleCameraState(key, isCameraHidden));
  }, []);

  const toggleMicrophoneState = useCallback((key, isMuted = null) => {
    dispatch(actions.toggleMicrophoneState(key, isMuted));
  }, []);

  const updateStreams = useCallback((key, streams) => {
    dispatch(actions.updateStreams(key, streams));
  }, []);

  const resetStageState = useCallback(({ omit: propertiesToOmit } = {}) => {
    dispatch(actions.resetStageState(propertiesToOmit));
  }, []);

  const updateIsBlockingRoute = useCallback((bool) => {
    dispatch(actions.updateIsBlockingRoute(bool));
  }, []);

  const updateIsSpectator = useCallback((bool) => {
    dispatch(actions.updateIsSpectator(bool));
  }, []);

  return useMemo(
    () => ({
      state,
      addParticipant,
      removeParticipant,
      updateParticipant,
      creatingStage,
      updateAnimateCollapseStageContainerWithDelay,
      updateShouldAnimateGoLiveButtonChevronIcon,
      updateShouldDisableStageButtonWithDelay,
      updateError,
      updateStageId,
      updateSuccess,
      resetStageState,
      toggleCameraState,
      toggleMicrophoneState,
      updateStreams,
      updateIsSpectator,
      updateIsBlockingRoute
    }),
    [
      addParticipant,
      removeParticipant,
      updateParticipant,
      creatingStage,
      resetStageState,
      state,
      toggleCameraState,
      toggleMicrophoneState,
      updateAnimateCollapseStageContainerWithDelay,
      updateError,
      updateShouldAnimateGoLiveButtonChevronIcon,
      updateStageId,
      updateStreams,
      updateSuccess,
      updateShouldDisableStageButtonWithDelay,
      updateIsSpectator,
      updateIsBlockingRoute
    ]
  );
};

export default useStageReducers;
