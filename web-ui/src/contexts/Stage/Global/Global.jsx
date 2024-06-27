import { createContext, useMemo } from 'react';
import PropTypes from 'prop-types';

import { useAnimationControls } from 'framer-motion';

import useGlobalReducers from './useGlobalReducer';
import useContextHook from '../../useContextHook';

const Context = createContext(null);
Context.displayName = 'Global';

export const Provider = ({ children }) => {
  const {
    state,
    animationCollapseStageControlsStart,
    updateAnimateCollapseStageContainerWithDelay,
    updateError,
    updateRequestingToJoinStage,
    updateShouldAnimateGoLiveButtonChevronIcon,
    updateShouldDisableStageButtonWithDelay,
    updateSuccess,
    updateHasStageRequestBeenApproved,
    updateStageRequestList,
    deleteRequestToJoin,
    updateIsChannelStagePlayerMuted
  } = useGlobalReducers();

  const {
    animateCollapseStageContainerWithDelay,
    shouldAnimateGoLiveButtonChevronIcon,
    shouldDisableStageButtonWithDelay,
    error,
    success,
    isChannelStagePlayerMuted,
    shouldCloseFullScreenViewOnConnectionError,
    requestingToJoinStage,
    hasStageRequestBeenApproved,
    stageRequestList
  } = state;
  const collaborateButtonAnimationControls = useAnimationControls();

  const value = useMemo(() => {
    return {
      // Channel
      isChannelStagePlayerMuted,
      updateIsChannelStagePlayerMuted,

      // Success & Error
      error,
      success,
      updateError,
      updateSuccess,
      shouldCloseFullScreenViewOnConnectionError,

      // Stage Animations
      animationCollapseStageControlsStart,
      collaborateButtonAnimationControls,
      animateCollapseStageContainerWithDelay,
      shouldAnimateGoLiveButtonChevronIcon,
      shouldDisableStageButtonWithDelay,
      updateAnimateCollapseStageContainerWithDelay,
      updateShouldAnimateGoLiveButtonChevronIcon,
      updateShouldDisableStageButtonWithDelay,

      // Stage Request States
      hasStageRequestBeenApproved,
      requestingToJoinStage,
      updateHasStageRequestBeenApproved,
      updateRequestingToJoinStage,
      updateStageRequestList,
      stageRequestList,
      deleteRequestToJoin
    };
  }, [
    animationCollapseStageControlsStart,
    animateCollapseStageContainerWithDelay,
    collaborateButtonAnimationControls,
    deleteRequestToJoin,
    error,
    hasStageRequestBeenApproved,
    isChannelStagePlayerMuted,
    requestingToJoinStage,
    success,
    shouldCloseFullScreenViewOnConnectionError,
    updateIsChannelStagePlayerMuted,
    shouldAnimateGoLiveButtonChevronIcon,
    shouldDisableStageButtonWithDelay,
    stageRequestList,
    updateAnimateCollapseStageContainerWithDelay,
    updateError,
    updateHasStageRequestBeenApproved,
    updateRequestingToJoinStage,
    updateShouldAnimateGoLiveButtonChevronIcon,
    updateShouldDisableStageButtonWithDelay,
    updateStageRequestList,
    updateSuccess
  ]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useGlobal = () => useContextHook(Context);
