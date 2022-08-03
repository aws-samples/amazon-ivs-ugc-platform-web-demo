import { useCallback, useEffect, useRef, useState } from 'react';

import { useMobileBreakpoint } from '../contexts/MobileBreakpoint';

const useControls = () => {
  const { isDefaultResponsiveView } = useMobileBreakpoint();
  const [isControlsOpen, setIsControlsOpen] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const timeoutId = useRef(null);
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
      if (!isDefaultResponsiveView) return;

      event.stopPropagation();
      resetControlsTimeout();
    },
    [isDefaultResponsiveView, resetControlsTimeout]
  );

  // Desktop controls toggling logic
  useEffect(() => {
    if (isDefaultResponsiveView === false && isHovered) {
      clearControlsTimeout();
      setIsControlsOpen(true);
    } else if (isDefaultResponsiveView === false && !isHovered) {
      resetControlsTimeout();
    }
  }, [
    clearControlsTimeout,
    isHovered,
    isDefaultResponsiveView,
    resetControlsTimeout
  ]);

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

    if (isDefaultResponsiveView) {
      mobileClickHandler();
      document.addEventListener('pointerdown', mobileClickHandler);
    }

    return () => {
      document.removeEventListener('pointerdown', mobileClickHandler);
    };
  }, [clearControlsTimeout, isDefaultResponsiveView, resetControlsTimeout]);

  return {
    isControlsOpen,
    setIsHovered,
    stopPropagAndResetTimeout
  };
};

export default useControls;
