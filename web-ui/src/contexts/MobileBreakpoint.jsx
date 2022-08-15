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
import useDebouncedCallback from '../hooks/useDebouncedCallback';

const Context = createContext(null);
Context.displayName = 'MobileBreakpoint';

export const Provider = ({ children }) => {
  const [currentBreakpoint, setCurrentBreakpoint] = useState();
  const mainRef = useRef();
  const mobileOverlayIds = useRef([]);
  const windowPageScrollY = useRef();

  const isDefaultResponsiveView = currentBreakpoint < BREAKPOINTS.md;
  const isLandscape = useMediaQuery('(orientation: landscape)');
  const isTouchscreenDevice = useMediaQuery('(hover:none)');
  const isMobileView =
    isDefaultResponsiveView || (isLandscape && isTouchscreenDevice);

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

      // Wait 300ms before locking the body to allow time for the panel slide transition to complete
      setTimeout(() => {
        if (mobileOverlayIds.current.length > 0) {
          lockBody();
        }
      }, 300);

      mobileOverlayIds.current.push(panelId);
    },
    [isDefaultResponsiveView, lockBody]
  );

  const removeMobileOverlay = useCallback(
    (panelId) => {
      if (!mobileOverlayIds.current.includes(panelId)) return;

      if (mobileOverlayIds.current.length === 1) {
        unlockBody();
      }

      mobileOverlayIds.current.pop();
    },
    [unlockBody]
  );

  // Set current breakpoint
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

  // Set --mobile-vh CSS variable
  const updateMobileVh = useDebouncedCallback(
    () => {
      if (!isDefaultResponsiveView && !isTouchscreenDevice) {
        document.documentElement.style.removeProperty('--mobile-vh'); // Remove --mobile-vh on desktop devices
        return;
      }

      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--mobile-vh', `${vh}px`);
    },
    100,
    [isDefaultResponsiveView, isTouchscreenDevice]
  );
  useEffect(() => {
    updateMobileVh();
    window.addEventListener('resize', updateMobileVh);

    return () => window.removeEventListener('resize', updateMobileVh);
  }, [updateMobileVh]);

  const value = useMemo(
    () => ({
      addMobileOverlay,
      currentBreakpoint,
      isDefaultResponsiveView,
      isLandscape,
      isMobileView,
      isTouchscreenDevice,
      mainRef,
      removeMobileOverlay
    }),
    [
      addMobileOverlay,
      currentBreakpoint,
      isDefaultResponsiveView,
      isLandscape,
      isMobileView,
      isTouchscreenDevice,
      removeMobileOverlay
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useMobileBreakpoint = () => useContextHook(Context);
