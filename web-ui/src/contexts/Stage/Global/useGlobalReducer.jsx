import { useReducer, useMemo, useCallback } from 'react';

import { globalReducer, defaultReducerState, actions } from './reducer';

const DELAY_COLLAPSE_ANIMATION = 500;

const useGlobalReducers = () => {
  const [state, dispatch] = useReducer(globalReducer, defaultReducerState);

  const updateShouldCloseFullScreenViewOnKickedOrHostLeave = useCallback(
    (value) => {
      dispatch(
        actions.updateShouldCloseFullScreenViewOnKickedOrHostLeave(value)
      );
    },
    []
  );

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

  const updateRequestingToJoinStage = useCallback((bool) => {
    dispatch(actions.updateRequestingToJoinStage(bool));
  }, []);

  const updateHasStageRequestBeenApproved = useCallback((bool) => {
    dispatch(actions.updateHasStageRequestBeenApproved(bool));
  }, []);

  // Channel page
  const updateIsChannelStagePlayerMuted = useCallback((bool) => {
    dispatch(actions.updateIsChannelStagePlayerMuted(bool));
  }, []);

  const updateStageRequestList = useCallback((requestee) => {
    dispatch(actions.updateStageRequestList(requestee));
  }, []);

  const deleteRequestToJoin = useCallback((requesteeChannelId) => {
    dispatch(actions.deleteRequestToJoin(requesteeChannelId));
  }, []);

  const updateIsJoiningStageByRequest = useCallback((bool) => {
    dispatch(actions.updateIsJoiningStageByRequest(bool));
  }, []);

  const updateIsJoiningStageByInvite = useCallback((bool) => {
    dispatch(actions.updateIsJoiningStageByInvite(bool));
  }, []);

  const updateShouldOpenSettingsModal = useCallback((bool) => {
    dispatch(actions.updateShouldOpenSettingsModal(bool));
  }, []);

  return useMemo(
    () => ({
      state,
      addParticipant,
      animationCollapseStageControlsStart,
      creatingStage,
      removeParticipant,
      resetParticipants,
      resetStageState,
      toggleCameraState,
      toggleMicrophoneState,
      updateAnimateCollapseStageContainerWithDelay,
      updateError,
      updateHasStageRequestBeenApproved,
      updateIsBlockingRoute,
      updateIsChannelStagePlayerMuted,
      updateIsSpectator,
      updateParticipant,
      updateRequestingToJoinStage,
      updateShouldAnimateGoLiveButtonChevronIcon,
      updateShouldDisableStageButtonWithDelay,
      updateStageId,
      updateStreams,
      updateSuccess,
      updateShouldCloseFullScreenViewOnKickedOrHostLeave,
      updateStageRequestList,
      deleteRequestToJoin,
      updateIsJoiningStageByRequest,
      updateIsJoiningStageByInvite,
      updateShouldOpenSettingsModal
    }),
    [
      state,
      addParticipant,
      animationCollapseStageControlsStart,
      creatingStage,
      removeParticipant,
      resetParticipants,
      resetStageState,
      toggleCameraState,
      toggleMicrophoneState,
      updateAnimateCollapseStageContainerWithDelay,
      updateError,
      updateHasStageRequestBeenApproved,
      updateIsBlockingRoute,
      updateIsChannelStagePlayerMuted,
      updateIsSpectator,
      updateParticipant,
      updateRequestingToJoinStage,
      updateShouldAnimateGoLiveButtonChevronIcon,
      updateShouldDisableStageButtonWithDelay,
      updateStageId,
      updateStreams,
      updateSuccess,
      updateShouldCloseFullScreenViewOnKickedOrHostLeave,
      updateStageRequestList,
      deleteRequestToJoin,
      updateIsJoiningStageByRequest,
      updateIsJoiningStageByInvite,
      updateShouldOpenSettingsModal
    ]
  );
};

export default useGlobalReducers;
