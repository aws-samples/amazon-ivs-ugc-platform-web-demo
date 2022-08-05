import { useCallback, useEffect, useRef, useState } from 'react';

import useMediaQuery from '../../../hooks/useMediaQuery';

const useControls = () => {
  const controlsContainerRef = useRef();
  const [isControlsOpen, setIsControlsOpen] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
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
  const onMouseEnterHandler = useCallback(() => {
    if (!supportsHover) return;

    setIsHovered(true);
  }, [supportsHover]);

  const onMouseLeaveHandler = useCallback(() => {
    if (!supportsHover) return;

    setIsHovered(false);
  }, [supportsHover]);

  // Desktop controls toggling logic
  useEffect(() => {
    if (supportsHover) {
      if (isHovered) {
        clearControlsTimeout();
        setIsControlsOpen(true);
      } else {
        resetControlsTimeout();
      }
    }
  }, [clearControlsTimeout, isHovered, supportsHover, resetControlsTimeout]);

  // Mobile controls toggling logic
  useEffect(() => {
    const mobileClickHandler = () => {
      if (!timeoutId.current) {
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
  }, [clearControlsTimeout, supportsHover, resetControlsTimeout]);

  return {
    controlsContainerRef,
    isControlsOpen,
    onMouseEnterHandler,
    onMouseLeaveHandler,
    stopPropagAndResetTimeout
  };
};

export default useControls;
