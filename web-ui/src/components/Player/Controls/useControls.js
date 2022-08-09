import { useCallback, useEffect, useRef, useState } from 'react';

import useMediaQuery from '../../../hooks/useMediaQuery';

const useControls = (isPaused) => {
  const controlsContainerRef = useRef();
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

  const stopPropagAndResetTimeout = useCallback(
    (event) => {
      if (supportsHover) return;

      event.stopPropagation();
      resetControlsTimeout();
    },
    [supportsHover, resetControlsTimeout]
  );

  const onMouseMoveHandler = useCallback(
    (e) => {
      if (!supportsHover || isPaused) return;

      isCoveringControlButton ? clearControlsTimeout() : resetControlsTimeout();
      setIsControlsOpen(true);
    },
    [
      supportsHover,
      resetControlsTimeout,
      clearControlsTimeout,
      isPaused,
      isCoveringControlButton
    ]
  );

  const onHoverOverHandler = useCallback(
    (e) => {
      if (!supportsHover || isPaused) return;

      if (e.target.id === 'control-button') {
        setIsCoveringControlButton(false);
        clearControlsTimeout();
        setIsControlsOpen(true);
      } else {
        setIsCoveringControlButton(true);
      }
    },
    [supportsHover, clearControlsTimeout, isPaused, setIsCoveringControlButton]
  );

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

  // Mobile controls toggling logic
  useEffect(() => {
    const mobileClickHandler = () => {
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
    };

    if (!supportsHover && controlsContainerRef?.current) {
      const currentControlsContainerRef = controlsContainerRef.current;

      mobileClickHandler();
      currentControlsContainerRef.addEventListener(
        'pointerdown',
        mobileClickHandler
      );

      return () =>
        currentControlsContainerRef.removeEventListener(
          'pointerdown',
          mobileClickHandler
        );
    }
  }, [clearControlsTimeout, supportsHover, resetControlsTimeout, isPaused]);

  return {
    controlsContainerRef,
    isControlsOpen,
    onMouseMoveHandler,
    onHoverOverHandler,
    stopPropagAndResetTimeout
  };
};

export default useControls;
