const calcAspectRatio = (width, height) => parseFloat(width / height);

export const isCssAspectRatioSupported = CSS.supports('aspect-ratio', '16/9');
export const isFireFox = CSS.supports('-moz-appearance', 'none');

/**
 * Creates a getter function that can be used to retrieve the width, height and aspect ratio
 * of the player section for both the collapsed and expanded profile view states.
 * - It does not matter which profile view state you are currently in as the player section
 *   dimensions will only change if the window is resized
 */
export const createPlayerSectionDimensionsGetter =
  ({
    playerSectionRef,
    chatSectionRef,
    isChatVisible,
    isStackedView,
    isPlayerAnimationRunning
  }) =>
  () => {
    if (!playerSectionRef.current || !chatSectionRef.current) return;

    const { clientWidth: chatSectionWidth } = chatSectionRef.current;
    const {
      width: currentPlayerSectionWidth,
      height: currentPlayerSectionHeight
    } = playerSectionRef.current.getBoundingClientRect();

    let collapsedPlayerSectionWidth,
      collapsedPlayerSectionHeight,
      expandedPlayerSectionWidth,
      expandedPlayerSectionHeight;

    if (isStackedView) {
      collapsedPlayerSectionWidth = expandedPlayerSectionWidth =
        currentPlayerSectionWidth;
      expandedPlayerSectionHeight = window.innerHeight;
      collapsedPlayerSectionHeight = Math.min(
        (currentPlayerSectionWidth * 9) / 16,
        window.innerHeight
      );
    } else {
      collapsedPlayerSectionHeight = expandedPlayerSectionHeight =
        currentPlayerSectionHeight;

      if (isChatVisible) {
        collapsedPlayerSectionWidth = currentPlayerSectionWidth;
        expandedPlayerSectionWidth =
          currentPlayerSectionWidth + chatSectionWidth;
      } else {
        /**
         * If the player animation is running, then the chat section will be in view once the animation ends.
         * Therefore, we must subtract the chat section width from the current player section width. Otherwise,
         * if the player animation is not running, then the chat section must have been hidden in isolation from
         * the rest of the profile view animation. So, the collapsed player section will not include the chat
         * section; thus, the collapsed player section width is equal to the current player section width.
         */
        collapsedPlayerSectionWidth = isPlayerAnimationRunning
          ? currentPlayerSectionWidth - chatSectionWidth
          : currentPlayerSectionWidth;
        expandedPlayerSectionWidth = currentPlayerSectionWidth;
      }
    }

    return {
      collapsed: {
        width: collapsedPlayerSectionWidth,
        height: collapsedPlayerSectionHeight,
        aspectRatio: calcAspectRatio(
          collapsedPlayerSectionWidth,
          collapsedPlayerSectionHeight
        )
      },
      expanded: {
        width: expandedPlayerSectionWidth,
        height: expandedPlayerSectionHeight,
        aspectRatio: calcAspectRatio(
          expandedPlayerSectionWidth,
          expandedPlayerSectionHeight
        )
      }
    };
  };

/**
 * Creates a setter function that can be used to set the width and height of the player
 * (e.g. StreamVideo, StreamOffline and StreamSpinner) using relative units so that the
 * player's dimensions change dynamically, while maintaining the correct aspect ratio,
 * as the window is resized
 */
export const createPlayerRelativeDimensionsSetter =
  ({
    playerSectionRef,
    chatSectionRef,
    isChatVisible,
    isStackedView,
    isDefaultResponsiveView,
    isProfileViewExpanded,
    isPlayerAnimationRunning,
    playerAnimationControls,
    visiblePlayerAspectRatio
  }) =>
  () => {
    if (!playerSectionRef.current || !chatSectionRef.current) return;

    if (isProfileViewExpanded) {
      // If the CSS aspect-ratio property is not supported, then the fixed width and height dimensions remain
      // as those dimensions will already give us a 16/9 aspect ratio for the current window size
      if (isCssAspectRatioSupported) {
        playerAnimationControls.set({
          width: isDefaultResponsiveView ? '90%' : '70%',
          height: 'auto'
        });
      }

      return;
    }

    const {
      collapsed: {
        width: collapsedPlayerSectionWidth,
        height: collapsedPlayerSectionHeight
      }
    } = createPlayerSectionDimensionsGetter({
      playerSectionRef,
      chatSectionRef,
      isChatVisible,
      isStackedView,
      isPlayerAnimationRunning
    })();
    const collapsedSectionAspectRatio = calcAspectRatio(
      collapsedPlayerSectionWidth,
      collapsedPlayerSectionHeight
    );

    if (collapsedSectionAspectRatio >= visiblePlayerAspectRatio) {
      playerAnimationControls.set({ width: 'auto', height: '100%' });
    } else if (collapsedSectionAspectRatio < visiblePlayerAspectRatio) {
      playerAnimationControls.set({ width: '100%', height: 'auto' });
    }
  };
