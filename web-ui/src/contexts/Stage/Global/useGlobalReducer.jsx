import { useReducer, useMemo, useCallback } from 'react';

import { globalReducer, defaultReducerState, actions } from './reducer';

const DELAY_COLLAPSE_ANIMATION = 500;

const useGlobalReducers = () => {
  const [state, dispatch] = useReducer(globalReducer, defaultReducerState);

  const addParticipant = useCallback((participantObj) => {
    dispatch(actions.addParticipant(participantObj));
  }, []);

  const removeParticipant = useCallback((userId) => {
    dispatch(actions.removeParticipant(userId));
  }, []);

  const updateParticipant = useCallback((key, participantObj) => {
    dispatch(actions.updateParticipant(key, participantObj));
  }, []);

  const updateStreams = useCallback((key, participantObj) => {
    dispatch(actions.updateStreams(key, participantObj));
  }, []);

  const toggleCameraState = useCallback((key, isCameraHidden = null) => {
    dispatch(actions.toggleCameraState(key, isCameraHidden));
  }, []);

  const toggleMicrophoneState = useCallback((key, isMuted = null) => {
    dispatch(actions.toggleMicrophoneState(key, isMuted));
  }, []);

  const updateIsSpectator = useCallback((bool) => {
    dispatch(actions.updateIsSpectator(bool));
  }, []);

  const resetParticipants = useCallback(() => {
    dispatch(actions.resetParticipants());
  }, []);

  // Stage
  const creatingStage = useCallback((isCreating) => {
    dispatch(actions.creatingStage(isCreating));
  }, []);

  const updateStageId = useCallback((stageId) => {
    dispatch(actions.updateStageId(stageId));
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

  const animationCollapseStageControlsStart = useCallback(() => {
    updateShouldAnimateGoLiveButtonChevronIcon(true);

    setTimeout(() => {
      updateAnimateCollapseStageContainerWithDelay(true);
    }, DELAY_COLLAPSE_ANIMATION);
  }, [
    updateAnimateCollapseStageContainerWithDelay,
    updateShouldAnimateGoLiveButtonChevronIcon
  ]);

  const updateError = useCallback((error) => {
    dispatch(actions.updateError(error));
  }, []);

  const updateSuccess = useCallback((msg) => {
    dispatch(actions.updateSuccess(msg));
  }, []);

  const resetStageState = useCallback(({ omit: propertiesToOmit } = {}) => {
    dispatch(actions.resetStageState(propertiesToOmit));
  }, []);

  const updateIsBlockingRoute = useCallback((bool) => {
    dispatch(actions.updateIsBlockingRoute(bool));
  }, []);

  return useMemo(
    () => ({
      state,
      addParticipant,
      removeParticipant,
      updateParticipant,
      resetParticipants,
      toggleCameraState,
      toggleMicrophoneState,
      updateIsSpectator,
      updateStageId,
      updateShouldDisableStageButtonWithDelay,
      animationCollapseStageControlsStart,
      updateAnimateCollapseStageContainerWithDelay,
      updateStreams,
      updateShouldAnimateGoLiveButtonChevronIcon,
      creatingStage,
      updateError,
      updateSuccess,
      resetStageState,
      updateIsBlockingRoute
    }),
    [
      state,
      addParticipant,
      removeParticipant,
      updateParticipant,
      resetParticipants,
      toggleCameraState,
      toggleMicrophoneState,
      updateIsSpectator,
      updateStageId,
      updateShouldDisableStageButtonWithDelay,
      animationCollapseStageControlsStart,
      updateAnimateCollapseStageContainerWithDelay,
      updateStreams,
      updateShouldAnimateGoLiveButtonChevronIcon,
      creatingStage,
      updateError,
      updateSuccess,
      resetStageState,
      updateIsBlockingRoute
    ]
  );
};

export default useGlobalReducers;
