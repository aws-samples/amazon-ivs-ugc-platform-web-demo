import PropTypes from 'prop-types';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';

import useContextHook from './useContextHook';

const Context = createContext(null);
Context.displayName = 'MobileBreakpoint';

const MOBILE_BREAKPOINT = 875; // px

export const Provider = ({ children }) => {
  const [isMobileView, setIsMobileView] = useState();
  const [mobileOverlayCount, setMobileOverlayCount] = useState(0);
  const addMobileOverlay = useCallback(
    () => setMobileOverlayCount((prev) => (isMobileView ? prev + 1 : prev)),
    [isMobileView]
  );
  const removeMobileOverlay = useCallback(
    () => setMobileOverlayCount((prev) => (isMobileView ? prev - 1 : prev)),
    [isMobileView]
  );

  useEffect(() => {
    if (isMobileView && mobileOverlayCount > 0) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = null;
    }
  }, [isMobileView, mobileOverlayCount]);

  useEffect(() => {
    const handleWindowResize = () => {
      setIsMobileView(window.innerWidth <= MOBILE_BREAKPOINT);
    };

    handleWindowResize();
    window.addEventListener('resize', handleWindowResize);

    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);

  const value = useMemo(
    () => ({ isMobileView, addMobileOverlay, removeMobileOverlay }),
    [isMobileView, addMobileOverlay, removeMobileOverlay]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useMobileBreakpoint = () => useContextHook(Context);
