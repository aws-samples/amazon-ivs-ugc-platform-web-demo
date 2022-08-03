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
import { isiOS } from '../utils';
import useContextHook from './useContextHook';
import useMediaQuery from '../hooks/useMediaQuery';

const Context = createContext(null);
Context.displayName = 'MobileBreakpoint';

export const Provider = ({ children }) => {
  const [currentBreakpoint, setCurrentBreakpoint] = useState();
  const mainRef = useRef();
  const mobileOverlayIds = useRef([]);
  const windowPageScrollY = useRef();

  const isDefaultResponsiveView = currentBreakpoint < BREAKPOINTS.md;
  const isMobileLandscape =
    useMediaQuery('(orientation: landscape)') &&
    currentBreakpoint < BREAKPOINTS.lg;

  const lockBody = useCallback(() => {
    if (isiOS()) {
      windowPageScrollY.current = window.pageYOffset;
      document.body.style.position = 'fixed';
    }

    document.body.style.overflow = 'hidden';
  }, []);

  const unlockBody = useCallback(() => {
    if (isiOS()) {
      document.querySelector('html').style.scrollBehavior = 'auto';
      document.body.style.position = null;

      window.scrollTo({
        top: windowPageScrollY.current,
        scrollBehavior: 'auto'
      });
      document.querySelector('html').style.scrollBehavior = 'smooth';

      windowPageScrollY.current = null;
    }

    document.body.style.overflow = null;
  }, []);

  const addMobileOverlay = useCallback(
    (panelId) => {
      if (
        mobileOverlayIds.current.includes(panelId) ||
        !isDefaultResponsiveView
      )
        return;

      if (mobileOverlayIds.current.length === 0) {
        setTimeout(lockBody, 300);
      }

      mobileOverlayIds.current.push(panelId);
    },
    [isDefaultResponsiveView, lockBody]
  );

  const removeMobileOverlay = useCallback(
    (panelId) => {
      if (
        !mobileOverlayIds.current.includes(panelId) ||
        !isDefaultResponsiveView
      )
        return;

      if (mobileOverlayIds.current.length === 1) {
        unlockBody();
      }

      mobileOverlayIds.current.pop();
    },
    [isDefaultResponsiveView, unlockBody]
  );

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
      addMobileOverlay,
      currentBreakpoint,
      isDefaultResponsiveView,
      isMobileLandscape,
      mainRef,
      removeMobileOverlay
    }),
    [
      addMobileOverlay,
      currentBreakpoint,
      isDefaultResponsiveView,
      isMobileLandscape,
      removeMobileOverlay
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useMobileBreakpoint = () => useContextHook(Context);
