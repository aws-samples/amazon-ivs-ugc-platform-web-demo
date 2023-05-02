import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import PropTypes from 'prop-types';

import { defaultViewerStreamActionTransition } from '../ViewerStreamActions/viewerStreamActionsTheme';
import { useChannel } from '../../../contexts/Channel';
import { useResponsiveDevice } from '../../../contexts/ResponsiveDevice';
import { useViewerStreamActions } from '../../../contexts/ViewerStreamActions';
import useContextHook from '../../../contexts/useContextHook';
import usePlayer from '../../../hooks/usePlayer';

const Context = createContext(null);
Context.displayName = 'Player';

const OVERLAY_TIMEOUT = 3000; // ms

export const Provider = ({ children }) => {
  /**
   * IVS Player
   */
  const {
    channelData: {
      isLive,
      playbackUrl,
      isViewerBanned,
      ingestConfiguration
    } = {}
  } = useChannel();
  const { setCurrentViewerAction } = useViewerStreamActions();

  const onTimedMetadataHandler = useCallback(
    (metadata) => {
      setCurrentViewerAction((prevViewerAction) => {
        if (metadata && prevViewerAction?.name === metadata?.name) {
          // This is done to ensure the animations are triggered when the same action is dispatched with new data
          setTimeout(() => {
            setCurrentViewerAction({
              ...metadata,
              startTime: Date.now()
            });
          }, defaultViewerStreamActionTransition.duration * 1000);

          return null;
        }

        return { ...metadata, startTime: Date.now() };
      });
    },
    [setCurrentViewerAction]
  );
  const player = usePlayer({
    isLive,
    playbackUrl,
    ingestConfiguration,
    onTimedMetadataHandler
  });
  const { hasError, isPaused } = player;

  /**
   * Player Overlay
   */
  const [isOverlayVisible, setIsOverlayVisible] = useState(true);
  const [isCoveringOverlayElement, setIsCoveringOverlayElement] =
    useState(false);
  const [shouldKeepOverlaysVisible, setShouldKeepOverlaysVisible] =
    useState(false);
  const { isTouchscreenDevice } = useResponsiveDevice();
  const targetElements = useRef(new Map());
  const timeoutId = useRef(null);

  const closeOverlay = useCallback(() => {
    if (shouldKeepOverlaysVisible) return;

    setIsOverlayVisible(false);
  }, [shouldKeepOverlaysVisible]);

  const clearOverlayTimeout = useCallback(() => {
    clearTimeout(timeoutId.current);
    timeoutId.current = null;
  }, []);

  const resetOverlayTimeout = useCallback(() => {
    clearOverlayTimeout();
    timeoutId.current = setTimeout(() => {
      closeOverlay();
      timeoutId.current = null;
    }, OVERLAY_TIMEOUT);
  }, [clearOverlayTimeout, closeOverlay]);

  const openOverlayAndResetTimeout = useCallback(() => {
    setIsOverlayVisible(true);
    resetOverlayTimeout();
  }, [setIsOverlayVisible, resetOverlayTimeout]);

  const openOverlayAndClearTimeout = useCallback(() => {
    setIsOverlayVisible(true);
    clearOverlayTimeout();
  }, [setIsOverlayVisible, clearOverlayTimeout]);

  /**
   * This function should be called in the individual button handlers to prevent
   * closing the overlay when tapping one of the individual buttons.
   */
  const stopPropagAndResetTimeout = useCallback(
    (event) => {
      if (!isTouchscreenDevice) return;

      event.stopPropagation();
      resetOverlayTimeout();
    },
    [isTouchscreenDevice, resetOverlayTimeout]
  );

  const onMouseMoveHandler = useCallback(() => {
    if (isTouchscreenDevice || isViewerBanned) return;

    isCoveringOverlayElement
      ? openOverlayAndClearTimeout()
      : openOverlayAndResetTimeout();
  }, [
    isTouchscreenDevice,
    isViewerBanned,
    isCoveringOverlayElement,
    openOverlayAndClearTimeout,
    openOverlayAndResetTimeout
  ]);

  // Mobile controls on tap logic
  const mobileClickHandler = useCallback(() => {
    if (!isTouchscreenDevice) return;

    if (isPaused || isViewerBanned) {
      openOverlayAndClearTimeout();
    } else if (!timeoutId.current) {
      openOverlayAndResetTimeout();
    } else {
      closeOverlay();
      clearOverlayTimeout();
    }
  }, [
    clearOverlayTimeout,
    closeOverlay,
    isPaused,
    isTouchscreenDevice,
    isViewerBanned,
    openOverlayAndClearTimeout,
    openOverlayAndResetTimeout
  ]);

  const handleControlsVisibility = useCallback(
    (event) => {
      if (isPaused || isViewerBanned) return;

      if (event.type === 'focus') {
        openOverlayAndResetTimeout();
      } else if (event.type === 'mouseenter') {
        setIsCoveringOverlayElement(true);
        openOverlayAndClearTimeout();
      } else if (['mouseleave', 'blur'].includes(event.type)) {
        setIsCoveringOverlayElement(false);
      }
    },
    [
      isPaused,
      isViewerBanned,
      openOverlayAndClearTimeout,
      openOverlayAndResetTimeout
    ]
  );

  const unsubscribeOverlayElement = useCallback((element) => {
    const removeEventListeners = targetElements.current.get(element);
    removeEventListeners?.();
    targetElements.current.delete(element);
  }, []);

  const subscribeOverlayElement = useCallback(
    (element) => {
      if (isTouchscreenDevice || !element) return;

      if (targetElements.current.has(element)) {
        unsubscribeOverlayElement(element);
      }

      element.addEventListener('focus', handleControlsVisibility);
      element.addEventListener('mouseenter', handleControlsVisibility);
      element.addEventListener('blur', handleControlsVisibility);
      element.addEventListener('mouseleave', handleControlsVisibility);

      targetElements.current.set(element, () => {
        element.removeEventListener('focus', handleControlsVisibility);
        element.removeEventListener('mouseenter', handleControlsVisibility);
        element.removeEventListener('blur', handleControlsVisibility);
        element.removeEventListener('mouseleave', handleControlsVisibility);
      });
    },
    [isTouchscreenDevice, handleControlsVisibility, unsubscribeOverlayElement]
  );

  useEffect(() => {
    if (isPaused || isViewerBanned) {
      openOverlayAndClearTimeout();
    } else {
      resetOverlayTimeout();
    }
  }, [
    isPaused,
    isTouchscreenDevice,
    isViewerBanned,
    openOverlayAndClearTimeout,
    resetOverlayTimeout
  ]);

  // Clean-up
  useEffect(() => {
    const targetEls = targetElements.current;

    return () => {
      for (const el of targetEls) {
        unsubscribeOverlayElement(el);
      }
    };
  }, [unsubscribeOverlayElement]);

  const value = useMemo(
    () => ({
      isOverlayVisible: hasError || isOverlayVisible,
      mobileClickHandler,
      onMouseMoveHandler,
      openOverlayAndResetTimeout,
      player,
      setShouldKeepOverlaysVisible,
      stopPropagAndResetTimeout,
      subscribeOverlayElement
    }),
    [
      hasError,
      isOverlayVisible,
      mobileClickHandler,
      onMouseMoveHandler,
      openOverlayAndResetTimeout,
      player,
      setShouldKeepOverlaysVisible,
      stopPropagAndResetTimeout,
      subscribeOverlayElement
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const usePlayerContext = () => useContextHook(Context);
