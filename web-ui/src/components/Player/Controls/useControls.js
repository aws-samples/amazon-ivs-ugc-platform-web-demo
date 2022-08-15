import { useCallback, useEffect, useRef, useState } from 'react';

import { useMobileBreakpoint } from '../../../contexts/MobileBreakpoint';

const useControls = (isPaused) => {
  const [isControlsOpen, setIsControlsOpen] = useState(true);
  const [isCoveringControlButton, setIsCoveringControlButton] = useState(false);
  const { isTouchscreenDevice } = useMobileBreakpoint();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const timeoutId = useRef(null);

  const clearControlsTimeout = useCallback(() => {
    clearTimeout(timeoutId.current);
    timeoutId.current = null;
  }, []);
  const closeControls = useCallback(() => {
    if (isPopupOpen) return;

    setIsControlsOpen(false);
  }, [isPopupOpen]);

  const resetControlsTimeout = useCallback(() => {
    clearControlsTimeout();
    timeoutId.current = setTimeout(() => {
      closeControls();
      timeoutId.current = null;
    }, 3000);
  }, [clearControlsTimeout, closeControls]);

  /**
   * This function should be called in the individual controls handlers to prevent closing the controls overlay when tapping one of the individual controls.
   */
  const stopPropagAndResetTimeout = useCallback(
    (event) => {
      if (!isTouchscreenDevice) return;

      event.stopPropagation();
      resetControlsTimeout();
    },
    [isTouchscreenDevice, resetControlsTimeout]
  );

  const onMouseMoveHandler = useCallback(() => {
    if (isTouchscreenDevice || isPaused) return;

    isCoveringControlButton ? clearControlsTimeout() : resetControlsTimeout();
    setIsControlsOpen(true);
  }, [
    clearControlsTimeout,
    isCoveringControlButton,
    isPaused,
    resetControlsTimeout,
    isTouchscreenDevice
  ]);

  const onControlHoverHandler = useCallback(
    (event) => {
      if (isTouchscreenDevice || isPaused) return;

      if (['mouseenter', 'focus'].includes(event.type)) {
        setIsCoveringControlButton(true);
        setIsControlsOpen(true);
        clearControlsTimeout();
      } else if (['mouseleave', 'blur'].includes(event.type))
        setIsCoveringControlButton(false);
    },
    [clearControlsTimeout, isPaused, isTouchscreenDevice]
  );

  // Mobile controls toggling logic
  const mobileClickHandler = useCallback(() => {
    if (!isTouchscreenDevice) return;

    if (isPaused) {
      setIsControlsOpen(true);
      clearControlsTimeout();
    } else if (!timeoutId.current) {
      setIsControlsOpen(true);
      resetControlsTimeout();
    } else {
      closeControls();
      clearControlsTimeout();
    }
  }, [
    clearControlsTimeout,
    closeControls,
    isPaused,
    isTouchscreenDevice,
    resetControlsTimeout
  ]);

  // Desktop controls toggling logic
  useEffect(() => {
    if (!isTouchscreenDevice) {
      if (isPaused) {
        clearControlsTimeout();
        setIsControlsOpen(true);
      } else {
        resetControlsTimeout();
      }
    }
  }, [
    clearControlsTimeout,
    isPaused,
    isTouchscreenDevice,
    resetControlsTimeout
  ]);

  useEffect(() => {
    if (isTouchscreenDevice) {
      mobileClickHandler();
    }
  }, [mobileClickHandler, isTouchscreenDevice]);

  return {
    isControlsOpen,
    mobileClickHandler,
    onMouseMoveHandler,
    onControlHoverHandler,
    setIsPopupOpen,
    stopPropagAndResetTimeout
  };
};

export default useControls;
