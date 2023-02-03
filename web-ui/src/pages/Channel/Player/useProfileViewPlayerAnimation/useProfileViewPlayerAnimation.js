import { useEffect, useLayoutEffect, useRef } from 'react';

import {
  createPlayerRelativeDimensionsSetter,
  createPlayerSectionDimensionsGetter,
  isCssAspectRatioSupported
} from './utils';
import { DEFAULT_PROFILE_VIEW_TRANSITION } from '../../../../constants';
import { setElementStyles } from '../../../../utils';
import { useChannelView } from '../../contexts/ChannelView';
import { useProfileViewAnimation } from '../../contexts/ProfileViewAnimation';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import useAnimationFrame from '../../../../hooks/useAnimationFrame';
import useLatest from '../../../../hooks/useLatest';
import useResizeObserver from '../../../../hooks/useResizeObserver';

const useProfileViewPlayerAnimation = ({
  chatSectionRef,
  hasPlayedFinalBuffer,
  isVideoVisible,
  playerSectionRef,
  targetPlayerRef,
  visiblePlayerAspectRatio
}) => {
  const {
    isChatVisible,
    isProfileViewAnimationRunning,
    isProfileViewExpanded,
    playerAnimationControls,
    shouldAnimateProfileView
  } = useProfileViewAnimation();
  const { isStackedView } = useChannelView();
  const { isMobileView } = useResponsiveDevice();
  const didInitializeFirstVideoFrame = useRef(false);
  const initialPlayerDimensions = useRef();
  const initialPlayerSectionDimensions = useRef();

  const getPlayerSectionDimensions = useLatest(
    createPlayerSectionDimensionsGetter({
      playerSectionRef,
      chatSectionRef,
      isChatVisible,
      isStackedView
    })
  );

  const setPlayerRelativeDimensions = useLatest(
    createPlayerRelativeDimensionsSetter({
      playerSectionRef,
      chatSectionRef,
      isChatVisible,
      isStackedView,
      isMobileView,
      isProfileViewExpanded,
      playerAnimationControls,
      visiblePlayerAspectRatio
    })
  );

  // Ensures that the player has the correct relative dimensions when resized
  useResizeObserver(
    playerSectionRef,
    setPlayerRelativeDimensions.current,
    !isProfileViewAnimationRunning
  );

  // Ensures that the first video frame is painted with the correct relative dimensions
  useLayoutEffect(() => {
    if (didInitializeFirstVideoFrame.current || !isVideoVisible) return;

    setPlayerRelativeDimensions.current();

    didInitializeFirstVideoFrame.current = true;
  }, [isProfileViewExpanded, isVideoVisible, setPlayerRelativeDimensions]);

  // Resets first video frame initialization
  useEffect(() => {
    if (hasPlayedFinalBuffer) didInitializeFirstVideoFrame.current = false;
  }, [hasPlayedFinalBuffer]);

  // Starts the player aspect ratio animation (expands or collapses depending on the current state)
  const { start: startPlayerAspectRatioAnimation } = useAnimationFrame(
    (progress) => {
      const {
        width: initialPlayerWidth,
        height: initialPlayerHeight,
        aspectRatio: initialPlayerAspectRatio
      } = initialPlayerDimensions.current;
      const {
        collapsed: {
          width: collapsedPlayerSectionWidth,
          height: collapsedPlayerSectionHeight,
          aspectRatio: collapsedSectionAspectRatio
        },
        expanded: { width: expandedPlayerSectionWidth }
      } = initialPlayerSectionDimensions.current;
      let finalPlayerWidth, finalPlayerHeight, finalAspectRatio;

      if (isProfileViewExpanded) {
        // profile view is expanding
        const widthFactor = isMobileView ? 0.8 : 0.7;

        finalAspectRatio = 16 / 9;
        finalPlayerWidth = widthFactor * expandedPlayerSectionWidth;
        finalPlayerHeight = (finalPlayerWidth * 9) / 16;
      } else {
        // profile view is collapsing
        finalAspectRatio = visiblePlayerAspectRatio;

        if (collapsedSectionAspectRatio >= visiblePlayerAspectRatio) {
          finalPlayerWidth = finalPlayerHeight * visiblePlayerAspectRatio;
          finalPlayerHeight = collapsedPlayerSectionHeight;
        } else if (collapsedSectionAspectRatio < visiblePlayerAspectRatio) {
          finalPlayerWidth = collapsedPlayerSectionWidth;
          finalPlayerHeight = finalPlayerWidth / visiblePlayerAspectRatio;
        }
      }

      const widthDiff = finalPlayerWidth - initialPlayerWidth;
      const heightDiff = finalPlayerHeight - initialPlayerHeight;
      const aspectRatioDiff = finalAspectRatio - initialPlayerAspectRatio;

      playerAnimationControls.set({
        width:
          isProfileViewExpanded || !isCssAspectRatioSupported
            ? initialPlayerWidth + widthDiff * progress
            : 'auto',
        height:
          isProfileViewExpanded && isCssAspectRatioSupported
            ? 'auto'
            : initialPlayerHeight + heightDiff * progress,
        aspectRatio: initialPlayerAspectRatio + aspectRatioDiff * progress
      });
    },
    // easeInOutCubic
    (progress) =>
      progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2
  );

  // Player aspect ratio animation entry point
  useEffect(() => {
    const animationDuration = shouldAnimateProfileView.current
      ? DEFAULT_PROFILE_VIEW_TRANSITION.duration * 1000
      : 0;

    initialPlayerDimensions.current = {
      width: targetPlayerRef.current.clientWidth,
      height: targetPlayerRef.current.clientHeight,
      aspectRatio: isProfileViewExpanded ? visiblePlayerAspectRatio : 16 / 9
    };
    initialPlayerSectionDimensions.current =
      getPlayerSectionDimensions.current();

    playerAnimationControls.mount();

    (async function runPlayerAspectRatioAnimation() {
      if (isProfileViewExpanded) {
        // Expand the profile view
        await startPlayerAspectRatioAnimation(animationDuration);
        setElementStyles(playerSectionRef.current, {
          'overflow-y': CSS.supports('overflow', 'overlay')
            ? 'overlay'
            : 'auto',
          'overflow-x': 'hidden'
        });
      } else {
        // Collapse the profile view
        playerSectionRef.current.scrollTo(0, 0);
        setElementStyles(playerSectionRef.current, { overflow: 'hidden' });
        await startPlayerAspectRatioAnimation(animationDuration);
      }

      setPlayerRelativeDimensions.current();
    })();
  }, [
    getPlayerSectionDimensions,
    isProfileViewExpanded,
    playerAnimationControls,
    playerSectionRef,
    setPlayerRelativeDimensions,
    shouldAnimateProfileView,
    startPlayerAspectRatioAnimation,
    targetPlayerRef,
    visiblePlayerAspectRatio
  ]);
};

export default useProfileViewPlayerAnimation;
