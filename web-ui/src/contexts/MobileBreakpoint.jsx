import PropTypes from 'prop-types';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import { BREAKPOINTS } from '../constants';
import useContextHook from './useContextHook';

const Context = createContext(null);
Context.displayName = 'MobileBreakpoint';

export const Provider = ({ children }) => {
  const mainRef = useRef();
  const [currentBreakpoint, setCurrentBreakpoint] = useState();
  const isDefaultResponsiveView = currentBreakpoint < BREAKPOINTS.md;
  const [mobileOverlayCount, setMobileOverlayCount] = useState(0);
  const addMobileOverlay = useCallback(
    () =>
      setMobileOverlayCount((prev) =>
        isDefaultResponsiveView ? prev + 1 : prev
      ),
    [isDefaultResponsiveView]
  );
  const removeMobileOverlay = useCallback(
    () =>
      setMobileOverlayCount((prev) =>
        isDefaultResponsiveView ? prev - 1 : prev
      ),
    [isDefaultResponsiveView]
  );

  useEffect(() => {
    if (isDefaultResponsiveView && mobileOverlayCount > 0) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = null;
    }
  }, [isDefaultResponsiveView, mobileOverlayCount]);

  useEffect(() => {
    const handleWindowResize = () => {
      const innerWidth = window.innerWidth;

      if (innerWidth >= BREAKPOINTS.lg) setCurrentBreakpoint(BREAKPOINTS.lg);
      else if (innerWidth >= BREAKPOINTS.md)
        setCurrentBreakpoint(BREAKPOINTS.md);
      else if (innerWidth >= BREAKPOINTS.sm)
        setCurrentBreakpoint(BREAKPOINTS.sm);
      else setCurrentBreakpoint(BREAKPOINTS.xs);
    };

    handleWindowResize();
    window.addEventListener('resize', handleWindowResize);

    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);

  const value = useMemo(
    () => ({
      currentBreakpoint,
      isDefaultResponsiveView,
      mainRef,
      addMobileOverlay,
      removeMobileOverlay
    }),
    [
      currentBreakpoint,
      isDefaultResponsiveView,
      addMobileOverlay,
      removeMobileOverlay
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useMobileBreakpoint = () => useContextHook(Context);
