import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const useScrollTopOnPathnameChange = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
};

export default useScrollTopOnPathnameChange;
