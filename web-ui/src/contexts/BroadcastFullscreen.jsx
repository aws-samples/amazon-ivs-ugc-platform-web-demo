import {
  useCallback,
  useReducer,
  useRef,
  useState,
  createContext,
  useMemo,
  useEffect
} from 'react';
import { useAnimationControls } from 'framer-motion';
import PropTypes from 'prop-types';

import useContextHook from './useContextHook';
import useResize from '../hooks/useResize';
import { useGlobalStage } from './Stage';
import { useResponsiveDevice } from './ResponsiveDevice';

export const STREAM_BUTTON_ANIMATION_DURATION = 0.55;
export const ANIMATION_DURATION = 0.25;
export const ANIMATION_TRANSITION = {
  duration: ANIMATION_DURATION,
  type: 'tween'
};

const Context = createContext(null);
Context.displayName = 'Fullscreen';

export const Provider = ({ children, previewRef }) => {
  const webBroadcastParentContainerRef = useRef();
  const collapsedContainerRef = useRef();
  const webBroadcastContainerRef = useRef();
  const goLiveButtonRef = useRef();
  const broadcastControllerRef = useRef();
  const { isJoiningStageByRequestOrInvite } = useGlobalStage();
  const { isDesktopView, isMobileView } = useResponsiveDevice();
  const [isFullScreenViewOpen, setIsFullScreenViewOpen] = useState(false);
  const [
    shouldRenderFullScreenCollaborateButton,
    setShouldRenderFullScreenCollaborateButton
  ] = useState(false);
  // webbroadcast canvas animation controls
  const fullscreenAnimationControls = useAnimationControls();
  const [dimensionClasses, setDimensionClasses] = useState([]);
  const webBroadcastCanvasContainerRef = useRef();
  const {
    isStageActive,
    collaborateButtonAnimationControls,
    animationCollapseStageControlsStart,
    shouldCloseFullScreenViewOnKickedOrHostLeave
  } = useGlobalStage();

  const [dimensions, updateDimensions] = useReducer(
    (prevState, nextState) => ({ ...prevState, ...nextState }),
    {
      animationInitialWidth: 0,
      animationInitialHeight: 0,
      animationInitialLeft: 0,
      animationInitialTop: 0,
      goLiveButtonInitialWidth: 0,
      broadcastControllerInitialMarginLeft: 0
    }
  );

  useEffect(() => {
    if (
      isFullScreenViewOpen &&
      !isDesktopView &&
      !isStageActive &&
      !isJoiningStageByRequestOrInvite
    ) {
      setIsFullScreenViewOpen(false);
    }
  }, [
    isDesktopView,
    isFullScreenViewOpen,
    isStageActive,
    isJoiningStageByRequestOrInvite
  ]);

  const calculateTopAndLeftValues = useCallback(() => {
    const topOffset = isDesktopView ? 0 : 56; // tab height
    const leftOffset = isMobileView ? 0 : 64; // add sidebar width
    const left =
      webBroadcastParentContainerRef.current?.offsetLeft + leftOffset;
    const top = webBroadcastParentContainerRef.current?.offsetTop + topOffset;

    return {
      left,
      top,
      goLiveButtonInitialWidth: goLiveButtonRef.current?.clientWidth,
      broadcastControllerInitialMarginLeft:
        broadcastControllerRef.current?.offsetLeft
    };
  }, [webBroadcastParentContainerRef, isDesktopView, isMobileView]);

  const initializeGoLiveContainerDimensions = useCallback(() => {
    const {
      top,
      left,
      goLiveButtonInitialWidth,
      broadcastControllerInitialMarginLeft
    } = calculateTopAndLeftValues();

    const width = webBroadcastContainerRef.current.offsetWidth;
    const height = webBroadcastContainerRef.current.offsetHeight;

    updateDimensions({
      animationInitialWidth: width,
      animationInitialHeight: height,
      animationInitialLeft: left,
      animationInitialTop: top,
      goLiveButtonInitialWidth,
      broadcastControllerInitialMarginLeft
    });
  }, [calculateTopAndLeftValues]);

  const handleToggleFullscreen = useCallback(() => {
    if (isFullScreenViewOpen) {
      setIsFullScreenViewOpen(false);
    } else {
      initializeGoLiveContainerDimensions();

      setIsFullScreenViewOpen(true);
    }
  }, [
    isFullScreenViewOpen,
    setIsFullScreenViewOpen,
    initializeGoLiveContainerDimensions
  ]);

  const handleOpenFullScreen = useCallback(() => {
    if (!isStageActive) {
      setShouldRenderFullScreenCollaborateButton(true);
    }

    collaborateButtonAnimationControls.start({ zIndex: 0 });
    handleToggleFullscreen();
  }, [
    isStageActive,
    collaborateButtonAnimationControls,
    handleToggleFullscreen
  ]);

  const calculateBaseTopAndLeftOnResize = () => {
    const {
      top,
      left,
      goLiveButtonInitialWidth,
      broadcastControllerInitialMarginLeft
    } = calculateTopAndLeftValues();

    updateDimensions({
      animationInitialLeft: left,
      animationInitialTop: top,
      goLiveButtonInitialWidth,
      broadcastControllerInitialMarginLeft
    });
  };

  useResize(calculateBaseTopAndLeftOnResize);

  const handleOnClose = useCallback(() => {
    if (isStageActive) {
      collaborateButtonAnimationControls.start({
        opacity: 1,
        zIndex: 'unset'
      });
      animationCollapseStageControlsStart();
    } else {
      // reset web broadcast canvas classes and animate the canvas dimensions back to initial values
      setTimeout(
        () => setShouldRenderFullScreenCollaborateButton(false),
        ANIMATION_DURATION * 1000
      );
    }

    setDimensionClasses([]);
    fullscreenAnimationControls.start({
      width: collapsedContainerRef.current?.clientWidth || 311,
      height: collapsedContainerRef.current?.clientHeight || 174.94,
      transition: ANIMATION_TRANSITION
    });

    handleToggleFullscreen();
  }, [
    animationCollapseStageControlsStart,
    collaborateButtonAnimationControls,
    handleToggleFullscreen,
    isStageActive,
    fullscreenAnimationControls
  ]);

  const handleOpenFullScreenView = useCallback(() => {
    initializeGoLiveContainerDimensions();
    setIsFullScreenViewOpen(true);
  }, [initializeGoLiveContainerDimensions]);

  const closeFullscreenAndAnimateCollaborateButton = useCallback(async () => {
    setIsFullScreenViewOpen(false);
    await collaborateButtonAnimationControls.start({
      zIndex: 1000,
      opacity: 1,
      transition: { duration: 0.45 }
    });
    collaborateButtonAnimationControls.start({ zIndex: 'unset' });
  }, [collaborateButtonAnimationControls]);

  useEffect(() => {
    if (!shouldCloseFullScreenViewOnKickedOrHostLeave) return;

    closeFullscreenAndAnimateCollaborateButton();
  }, [
    closeFullscreenAndAnimateCollaborateButton,
    collaborateButtonAnimationControls,
    shouldCloseFullScreenViewOnKickedOrHostLeave
  ]);

  const value = useMemo(
    () => ({
      isFullScreenViewOpen,
      setIsFullScreenViewOpen,
      // Stage
      dimensions,
      handleToggleFullscreen,
      initializeGoLiveContainerDimensions,
      // WebBroadcast
      webBroadcastCanvasContainerRef,
      fullscreenAnimationControls,
      dimensionClasses,
      setDimensionClasses,
      // Shared between broadcast and stage
      collaborateButtonAnimationControls,
      handleOnClose,
      handleOpenFullScreen,
      previewRef,
      setShouldRenderFullScreenCollaborateButton,
      shouldRenderFullScreenCollaborateButton,
      webBroadcastContainerRef,
      webBroadcastParentContainerRef,
      handleOpenFullScreenView,
      closeFullscreenAndAnimateCollaborateButton,
      goLiveButtonRef,
      broadcastControllerRef,
      collapsedContainerRef
    }),
    [
      collaborateButtonAnimationControls,
      dimensions,
      handleOnClose,
      handleOpenFullScreen,
      handleToggleFullscreen,
      initializeGoLiveContainerDimensions,
      isFullScreenViewOpen,
      previewRef,
      shouldRenderFullScreenCollaborateButton,
      fullscreenAnimationControls,
      dimensionClasses,
      webBroadcastContainerRef,
      webBroadcastParentContainerRef,
      handleOpenFullScreenView,
      closeFullscreenAndAnimateCollaborateButton,
      goLiveButtonRef,
      broadcastControllerRef,
      collapsedContainerRef
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = {
  previewRef: PropTypes.shape({ current: PropTypes.object }).isRequired,
  children: PropTypes.node.isRequired
};

export const useBroadcastFullScreen = () => useContextHook(Context);
