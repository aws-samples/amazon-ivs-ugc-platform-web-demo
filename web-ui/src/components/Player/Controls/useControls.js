import { useCallback, useEffect, useRef, useState } from 'react';

import useMediaQuery from '../../../hooks/useMediaQuery';

const useControls = (isPaused) => {
  const [isControlsOpen, setIsControlsOpen] = useState(true);
  const [isCoveringControlButton, setIsCoveringControlButton] = useState(false);
  const timeoutId = useRef(null);
  const supportsHover = useMediaQuery('(hover: hover)');

  const clearControlsTimeout = useCallback(() => {
    clearTimeout(timeoutId.current);
    timeoutId.current = null;
  }, []);

  const resetControlsTimeout = useCallback(() => {
    clearControlsTimeout();
    timeoutId.current = setTimeout(() => {
      setIsControlsOpen(false);
      timeoutId.current = null;
    }, 3000);
  }, [clearControlsTimeout]);

  /**
   * This function should be called in the individual controls handlers to prevent closing the controls overlay when tapping one of the individual controls.
   */
  const stopPropagAndResetTimeout = useCallback(
    (event) => {
      if (supportsHover) return;

      event.stopPropagation();
      resetControlsTimeout();
    },
    [supportsHover, resetControlsTimeout]
  );

  const onMouseMoveHandler = useCallback(() => {
    if (!supportsHover || isPaused) return;

    isCoveringControlButton ? clearControlsTimeout() : resetControlsTimeout();
    setIsControlsOpen(true);
  }, [
    clearControlsTimeout,
    isCoveringControlButton,
    isPaused,
    resetControlsTimeout,
    supportsHover
  ]);

  const onControlHoverHandler = useCallback(
    (event) => {
      if (!supportsHover || isPaused) return;

      if (['mouseenter', 'focus'].includes(event.type)) {
        setIsCoveringControlButton(true);
        setIsControlsOpen(true);
        clearControlsTimeout();
      } else if (['mouseleave', 'blur'].includes(event.type))
        setIsCoveringControlButton(false);
    },
    [clearControlsTimeout, isPaused, supportsHover]
  );

  // Mobile controls toggling logic
  const mobileClickHandler = useCallback(() => {
    if (supportsHover) return;

    if (isPaused) {
      setIsControlsOpen(true);
      clearControlsTimeout();
    } else if (!timeoutId.current) {
      setIsControlsOpen(true);
      resetControlsTimeout();
    } else {
      setIsControlsOpen(false);
      clearControlsTimeout();
    }
  }, [clearControlsTimeout, isPaused, resetControlsTimeout, supportsHover]);

  // Desktop controls toggling logic
  useEffect(() => {
    if (supportsHover) {
      if (isPaused) {
        clearControlsTimeout();
        setIsControlsOpen(true);
      } else {
        resetControlsTimeout();
      }
    }
  }, [clearControlsTimeout, isPaused, supportsHover, resetControlsTimeout]);

  useEffect(() => {
    if (!supportsHover) {
      mobileClickHandler();
    }
  }, [mobileClickHandler, supportsHover]);

  return {
    isControlsOpen,
    mobileClickHandler,
    onMouseMoveHandler,
    onControlHoverHandler,
    stopPropagAndResetTimeout
  };
};

export default useControls;
