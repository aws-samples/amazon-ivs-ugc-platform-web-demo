import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { useResponsiveDevice } from '../contexts/ResponsiveDevice';

const useScrollToTop = ({ dependency, isResponsiveView }) => {
  const location = useLocation();
  const { mainRef } = useResponsiveDevice();

  useEffect(() => {
    if (mainRef.current) {
      if (isResponsiveView) {
        setTimeout(() => window.scrollTo(0, 0), 100);
      } else {
        setTimeout(() => mainRef.current?.scrollTo(0, 0), 100);
      }
    }
  }, [dependency, isResponsiveView, location.pathname, mainRef]);
};

export default useScrollToTop;
