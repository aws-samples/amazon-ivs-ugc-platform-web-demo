import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { useMobileBreakpoint } from '../contexts/MobileBreakpoint';

const useScrollToTop = (dependency) => {
  const location = useLocation();
  const mainRef = useRef();
  const { isMobileView } = useMobileBreakpoint();

  useEffect(() => {
    if (mainRef.current) {
      if (isMobileView) {
        setTimeout(() => window.scrollTo(0, 0), 100);
      } else {
        setTimeout(() => mainRef.current.scrollTo(0, 0), 100);
      }
    }
  }, [isMobileView, location.pathname, dependency]);

  return { mainRef };
};

export default useScrollToTop;
