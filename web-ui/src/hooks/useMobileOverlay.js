import { useEffect } from 'react';
import { useMobileBreakpoint } from '../contexts/MobileBreakpoint';

const useMobileOverlay = () => {
  const { addMobileOverlay, removeMobileOverlay } = useMobileBreakpoint();

  useEffect(() => {
    addMobileOverlay();

    return () => removeMobileOverlay();
  }, [addMobileOverlay, removeMobileOverlay]);
};

export default useMobileOverlay;
