import { useCallback, useEffect, useRef, useState } from 'react';

import { useMobileBreakpoint } from '../../../contexts/MobileBreakpoint';

const useControls = (isPaused, isViewerBanned) => {
  const [isFullscreenEnabled, setIsFullscreenEnabled] = useState(false);
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

  const openControlsResetTimeout = useCallback(() => {
    setIsControlsOpen(true);
    resetControlsTimeout();
  }, [setIsControlsOpen, resetControlsTimeout]);

  const openControlsClearTimeout = useCallback(() => {
    setIsControlsOpen(true);
    clearControlsTimeout();
  }, [setIsControlsOpen, clearControlsTimeout]);

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

  const onTabbingHandler = useCallback(() => {
    if (isTouchscreenDevice || isPaused) return;

    openControlsResetTimeout();
  }, [isTouchscreenDevice, isPaused, openControlsResetTimeout]);

  const onMouseMoveHandler = useCallback(() => {
    if (isTouchscreenDevice || isPaused || isViewerBanned) return;

    isCoveringControlButton
      ? openControlsClearTimeout()
      : openControlsResetTimeout();
  }, [
    isTouchscreenDevice,
    isPaused,
    isViewerBanned,
    isCoveringControlButton,
    openControlsClearTimeout,
    openControlsResetTimeout
  ]);

  const onControlHoverHandler = useCallback(
    (event) => {
      if (isTouchscreenDevice || isPaused || isViewerBanned) return;

      if (event.type === 'focus') {
        openControlsResetTimeout();
      } else if (event.type === 'mouseenter') {
        setIsCoveringControlButton(true);
        openControlsClearTimeout();
      } else if (['mouseleave', 'blur'].includes(event.type))
        setIsCoveringControlButton(false);
    },
    [
      isTouchscreenDevice,
      isPaused,
      isViewerBanned,
      openControlsResetTimeout,
      openControlsClearTimeout
    ]
  );

  // Mobile controls toggling logic
  const mobileClickHandler = useCallback(() => {
    if (!isTouchscreenDevice) return;

    if (isPaused || isViewerBanned) {
      openControlsClearTimeout();
    } else if (!timeoutId.current) {
      openControlsResetTimeout();
    } else {
      closeControls();
      clearControlsTimeout();
    }
  }, [
    isTouchscreenDevice,
    isPaused,
    isViewerBanned,
    openControlsClearTimeout,
    openControlsResetTimeout,
    closeControls,
    clearControlsTimeout
  ]);

  // Desktop controls toggling logic
  useEffect(() => {
    if (isTouchscreenDevice) return;

    if (isPaused || isViewerBanned) {
      clearControlsTimeout();
      setIsControlsOpen(true);
    } else {
      resetControlsTimeout();
    }
  }, [
    clearControlsTimeout,
    isPaused,
    isTouchscreenDevice,
    isViewerBanned,
    resetControlsTimeout
  ]);

  useEffect(() => {
    if (isTouchscreenDevice) {
      mobileClickHandler();
    }
  }, [mobileClickHandler, isTouchscreenDevice]);

  return {
    isControlsOpen,
    isFullscreenEnabled,
    mobileClickHandler,
    onControlHoverHandler,
    onMouseMoveHandler,
    setIsFullscreenEnabled,
    setIsPopupOpen,
    stopPropagAndResetTimeout,
    onTabbingHandler
  };
};

export default useControls;
