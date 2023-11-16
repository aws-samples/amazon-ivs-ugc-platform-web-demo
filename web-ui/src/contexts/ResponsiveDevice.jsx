import { createContext, useCallback, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import { BREAKPOINTS } from '../constants';
import { isiOS } from '../utils';
import useContextHook from './useContextHook';
import useDebouncedCallback from '../hooks/useDebouncedCallback';
import useMediaQuery from '../hooks/useMediaQuery';
import useResize from '../hooks/useResize';

const Context = createContext(null);
Context.displayName = 'ResponsiveDevice';

export const Provider = ({ children }) => {
  const [dimensions, setDimensions] = useState();
  const [currentBreakpoint, setCurrentBreakpoint] = useState();
  const mainRef = useRef();
  const mobileOverlayIds = useRef([]);
  const windowPageScrollY = useRef();
  const isLandscapeMatches = useMediaQuery('(orientation: landscape)');
  const [isLandscape, setIsLandscape] = useState();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const isDefaultResponsiveView = currentBreakpoint < BREAKPOINTS.md;
  const isTouchscreenDevice = !useMediaQuery(
    '(hover: hover) and (pointer: fine)'
  );
  const isMobileView =
    isDefaultResponsiveView ||
    (isLandscape && isTouchscreenDevice && currentBreakpoint < BREAKPOINTS.lg);

  const isDesktopView = currentBreakpoint >= BREAKPOINTS.lg;

  const lockBody = useCallback(() => {
    if (isiOS()) {
      windowPageScrollY.current = window.pageYOffset;
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    }

    document.body.style.overflow = 'hidden';
  }, []);

  const unlockBody = useCallback(() => {
    if (isiOS()) {
      document.querySelector('html').style.scrollBehavior = 'auto';
      document.body.style.position = null;
      document.body.style.width = null;

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

  // Set current width and height
  const updateCurrentDimensions = useCallback(() => {
    if (!window?.innerWidth && !window?.innerHeight) return;

    setDimensions({
      height: window.innerHeight,
      width: window.innerWidth
    });
  }, []);

  // Set current breakpoint
  const updateCurrentBreakpoint = useCallback(() => {
    const innerWidth = window.innerWidth;

    if (innerWidth >= BREAKPOINTS.lg) setCurrentBreakpoint(BREAKPOINTS.lg);
    else if (innerWidth >= BREAKPOINTS.md) setCurrentBreakpoint(BREAKPOINTS.md);
    else if (innerWidth >= BREAKPOINTS.sm) setCurrentBreakpoint(BREAKPOINTS.sm);
    else if (innerWidth >= BREAKPOINTS.xs) setCurrentBreakpoint(BREAKPOINTS.xs);
    else setCurrentBreakpoint(BREAKPOINTS.xxs);
  }, []);

  // Set --mobile-vh and --mobile-vw CSS variables
  const updateMobileVh = useDebouncedCallback(() => {
    if (!isDefaultResponsiveView && !isTouchscreenDevice) {
      document.documentElement.style.removeProperty('--mobile-vh'); // Remove --mobile-vh on desktop devices
      document.documentElement.style.removeProperty('--mobile-vw'); // Remove --mobile-vw on desktop devices
      return;
    }

    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--mobile-vh', `${vh}px`);
    const vw = window.innerWidth * 0.01;
    document.documentElement.style.setProperty('--mobile-vw', `${vw}px`);
  }, 100);

  const updateOrientation = useCallback(() => {
    /**
     * screen.orientation has proven to be more accurate than the CSS media query for touchscreen devices.
     * Most specifically on Firefox mobile, some devices are switch to landscape when the virtual keyboard is open when they're still technically in portrait mode.
     */
    if (window.screen?.orientation && isTouchscreenDevice)
      setIsLandscape(!!window.screen.orientation.type.includes('landscape'));
    else setIsLandscape(isLandscapeMatches);
  }, [isLandscapeMatches, isTouchscreenDevice]);

  useResize(
    useCallback(() => {
      updateMobileVh();
      updateCurrentBreakpoint();
      updateOrientation();
      updateCurrentDimensions();
    }, [
      updateCurrentBreakpoint,
      updateCurrentDimensions,
      updateMobileVh,
      updateOrientation
    ]),
    { shouldCallOnMount: true }
  );

  const value = useMemo(
    () => ({
      addMobileOverlay,
      currentBreakpoint,
      dimensions,
      isDefaultResponsiveView,
      isDesktopView,
      isLandscape,
      isMobileView,
      isProfileMenuOpen,
      isTouchscreenDevice,
      mainRef,
      removeMobileOverlay,
      setIsProfileMenuOpen
    }),
    [
      addMobileOverlay,
      currentBreakpoint,
      dimensions,
      isDefaultResponsiveView,
      isDesktopView,
      isLandscape,
      isMobileView,
      isProfileMenuOpen,
      isTouchscreenDevice,
      removeMobileOverlay
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useResponsiveDevice = () => useContextHook(Context);
