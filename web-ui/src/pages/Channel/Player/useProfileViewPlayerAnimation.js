import { useAnimationControls } from 'framer-motion';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react';

import { DEFAULT_PROFILE_VIEW_TRANSITION } from '../../../constants';
import useAnimationFrame from '../../../hooks/useAnimationFrame';
import useLatest from '../../../hooks/useLatest';
import usePrevious from '../../../hooks/usePrevious';
import useResize from '../../../hooks/useResize';

const isCssAspectRatioSupported = CSS.supports('aspect-ratio', '16/9');
const overflowClasses = [
  'overflow-x-hidden',
  'overflow-y-auto',
  'supports-overlay:overflow-y-overlay'
];

const useProfileViewPlayerAnimation = ({
  hasPlayedFinalBuffer,
  isLoading,
  isProfileExpanded,
  playerSectionRef,
  shouldShowStream,
  targetRef,
  videoAspectRatio
}) => {
  const [isProfileViewAnimationRunning, setIsProfileViewAnimationRunning] =
    useState(false);
  const playerAnimationControls = useAnimationControls();
  const prevIsProfileExpanded = usePrevious(isProfileExpanded);
  const initialPlayerDimensions = useRef();
  const initialPlayerSectionDimensions = useRef();
  const didProfileViewChange = useLatest(
    prevIsProfileExpanded !== undefined &&
      prevIsProfileExpanded !== isProfileExpanded
  );
  const isVideoVisible = shouldShowStream && !isLoading;
  const playerAspectRatio = isVideoVisible ? videoAspectRatio : 16 / 9;

  const getPlayerSectionAspectRatio = useCallback(() => {
    const { width: playerSectionWidth, height: playerSectionHeight } =
      playerSectionRef.current.getBoundingClientRect();
    const adjustedPlayerSectionWidth = isProfileExpanded
      ? playerSectionWidth - 360
      : playerSectionWidth;

    return parseFloat(
      (adjustedPlayerSectionWidth / playerSectionHeight).toFixed(5)
    );
  }, [isProfileExpanded, playerSectionRef]);

  const getOriginalPlayerDimensions = useCallback(() => {
    const sectionAspectRatio = getPlayerSectionAspectRatio();

    if (sectionAspectRatio >= playerAspectRatio) {
      return { width: 'auto', height: '100%' };
    } else if (sectionAspectRatio < playerAspectRatio) {
      return { width: '100%', height: 'auto' };
    }
  }, [getPlayerSectionAspectRatio, playerAspectRatio]);

  useResize(() => {
    if (isProfileExpanded) return;

    const { width, height } = getOriginalPlayerDimensions();
    playerAnimationControls.set({ width, height });
  });

  const { start: startPlayerAspectRatioAnimation } = useAnimationFrame(
    (progress) => {
      const { width: initialPlayerWidth, height: initialPlayerHeight } =
        initialPlayerDimensions.current;
      const {
        width: initialPlayerSectionWidth,
        height: initialPlayerSectionHeight
      } = initialPlayerSectionDimensions.current;
      const initialPlayerAspectRatio = isProfileExpanded
        ? playerAspectRatio
        : 16 / 9;
      const sectionAspectRatio = getPlayerSectionAspectRatio();
      let finalPlayerWidth, finalPlayerHeight, finalAspectRatio;

      if (isProfileExpanded) {
        // profile view is expanding
        finalAspectRatio = 16 / 9;
        finalPlayerWidth = 0.7 * (initialPlayerSectionWidth + 360);
        finalPlayerHeight = (finalPlayerWidth * 9) / 16;
      } else {
        // profile view is collapsing
        finalAspectRatio = playerAspectRatio;

        if (sectionAspectRatio >= playerAspectRatio) {
          finalPlayerHeight = initialPlayerSectionHeight;
          finalPlayerWidth = finalPlayerHeight * playerAspectRatio;
        } else if (sectionAspectRatio < playerAspectRatio) {
          finalPlayerWidth = initialPlayerSectionWidth;
          finalPlayerHeight = finalPlayerWidth / playerAspectRatio;
        }
      }

      const widthDiff = finalPlayerWidth - initialPlayerWidth;
      const heightDiff = finalPlayerHeight - initialPlayerHeight;
      const aspectRatioDiff = finalAspectRatio - initialPlayerAspectRatio;

      playerAnimationControls.set({
        width:
          isProfileExpanded || !isCssAspectRatioSupported
            ? initialPlayerWidth + widthDiff * progress
            : 'auto',
        height:
          isProfileExpanded && isCssAspectRatioSupported
            ? 'auto'
            : initialPlayerHeight + heightDiff * progress,
        aspectRatio: initialPlayerAspectRatio + aspectRatioDiff * progress
      });
    }
  );

  // For videos that go live while in collapsed mode, this effect ensures that
  // the first video frame is painted with the correct aspect ratio and dimensions
  const didInitializeFirstVideoFrame = useRef(false);
  useLayoutEffect(() => {
    if (didInitializeFirstVideoFrame.current || !isVideoVisible) return;

    if (isProfileExpanded) {
      didInitializeFirstVideoFrame.current = true;
      return;
    }

    const {
      width: originalRelativePlayerWidth,
      height: originalRelativePlayerHeight
    } = getOriginalPlayerDimensions();

    try {
      playerAnimationControls.set({
        aspectRatio: 'auto',
        width: originalRelativePlayerWidth,
        height: originalRelativePlayerHeight
      });
    } catch (error) {
      // swallow the error - error is likely due to delayed initialization of animation controls
    }

    didInitializeFirstVideoFrame.current = true;
  }, [
    getOriginalPlayerDimensions,
    isProfileExpanded,
    isVideoVisible,
    playerAnimationControls
  ]);

  // Clean-up first frame initialization
  useEffect(() => {
    if (hasPlayedFinalBuffer) didInitializeFirstVideoFrame.current = false;
  }, [hasPlayedFinalBuffer]);

  useEffect(() => {
    const shouldAnimate = didProfileViewChange.current;
    const profileViewControl =
      shouldAnimate && isCssAspectRatioSupported
        ? playerAnimationControls.start
        : playerAnimationControls.set;

    (async function handleProfileViewAnimation() {
      const {
        width: originalRelativePlayerWidth,
        height: originalRelativePlayerHeight
      } = getOriginalPlayerDimensions();
      const {
        clientWidth: currentPlayerWidth,
        clientHeight: currentPlayerHeight
      } = targetRef.current || {};
      const {
        clientWidth: playerSectionWidth,
        clientHeight: playerSectionHeight
      } = playerSectionRef.current;
      initialPlayerDimensions.current = {
        width: currentPlayerWidth,
        height: currentPlayerHeight
      };
      initialPlayerSectionDimensions.current = {
        width: isProfileExpanded
          ? playerSectionWidth
          : playerSectionWidth - 360,
        height: playerSectionHeight
      };
      const playerAspectRatioAnimationDuration = shouldAnimate
        ? DEFAULT_PROFILE_VIEW_TRANSITION.duration * 1000
        : 0;

      setIsProfileViewAnimationRunning(shouldAnimate);

      if (isProfileExpanded) {
        // Expand the profile view
        await Promise.all([
          startPlayerAspectRatioAnimation(playerAspectRatioAnimationDuration),
          profileViewControl({
            borderRadius: '24px',
            top: '340px',
            y: 0,
            transition: DEFAULT_PROFILE_VIEW_TRANSITION
          })
        ]);

        // Constrain the width and height using relative units to allow for resizing
        if (isCssAspectRatioSupported) {
          playerAnimationControls.set({
            aspectRatio: '16/9',
            width: '70%',
            height: 'auto'
          });
        }

        // Add overflow
        setTimeout(() => {
          playerSectionRef.current.classList.add(...overflowClasses);
          playerSectionRef.current.classList.remove('overflow-hidden');
        }, 100);
      } else {
        // Scroll section to top to set up collapse animation
        playerSectionRef.current.scrollTo(0, 0);

        // Remove overflow
        setTimeout(() => {
          playerSectionRef.current.classList.add('overflow-hidden');
          playerSectionRef.current.classList.remove(...overflowClasses);
        }, 100);

        // Collapse the profile view
        await Promise.all([
          startPlayerAspectRatioAnimation(playerAspectRatioAnimationDuration),
          profileViewControl({
            borderRadius: 0,
            top: '50%',
            y: '-50%',
            transition: DEFAULT_PROFILE_VIEW_TRANSITION
          })
        ]);

        // Constrain the width and height using relative units to allow for resizing
        playerAnimationControls.set({
          ...(isVideoVisible ? { aspectRatio: 'auto' } : {}),
          width: originalRelativePlayerWidth,
          height: originalRelativePlayerHeight
        });
      }

      setIsProfileViewAnimationRunning(false);
    })();
  }, [
    didProfileViewChange,
    getOriginalPlayerDimensions,
    isProfileExpanded,
    isVideoVisible,
    playerAnimationControls,
    playerSectionRef,
    startPlayerAspectRatioAnimation,
    targetRef
  ]);

  return { isProfileViewAnimationRunning, playerAnimationControls };
};

export default useProfileViewPlayerAnimation;
