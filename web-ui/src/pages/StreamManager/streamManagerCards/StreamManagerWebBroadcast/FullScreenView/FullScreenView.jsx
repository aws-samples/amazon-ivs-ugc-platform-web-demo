import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { useMemo, useRef } from 'react';

import { clsm } from '../../../../../utils';
import { createAnimationProps } from '../../../../../helpers/animationPropsHelper';
import { useModal } from '../../../../../contexts/Modal';
import StageVideoFeeds, {
  STAGE_VIDEO_FEEDS_TYPES
} from '../StageVideoFeeds/StageVideoFeeds';
import { useResponsiveDevice } from '../../../../../contexts/ResponsiveDevice';
import BroadcastFullScreenVideoFeed from './BroadcastFullScreenVideoFeed';
import Footer from './Footer';
import Header from './Header';
import useFocusTrap from '../../../../../hooks/useFocusTrap';
import withPortal from '../../../../../components/withPortal';
import { useStageManager } from '../../../../../contexts/StageManager';
import Spinner from '../../../../../components/Spinner';
import {
  STREAM_MODES,
  updateFullscreenStates
} from '../../../../../reducers/streamManager';
import {
  COLLABORATE_ROUTE_PATH,
  FULLSCREEN_ANIMATION_DURATION,
  FULLSCREEN_ANIMATION_TRANSITION
} from '../../../../../constants';

const FullScreenView = () => {
  const dispatch = useDispatch();
  const {
    fullscreen: { isOpen: isFullscreenOpen },
    animationInitialPos,
    fullscreen,
    streamMode
  } = useSelector((state) => state.streamManager);
  const { collaborate } = useSelector((state) => state.shared);
  const { user: { isConnected: isStageConnected = false } = {} } =
    useStageManager() || {};
  const { isModalOpen } = useModal();
  const { pathname } = useLocation();
  const fullScreenViewContainerRef = useRef();
  const { isMobileView, dimensions: windowDimensions } = useResponsiveDevice();
  const { height: windowHeight } = windowDimensions;
  const shouldAddScrollbar = windowHeight <= 350;

  const onAnimationStart = () => {
    dispatch(updateFullscreenStates({ isAnimating: true }));
  };

  const onAnimationComplete = () => {
    // When fullscreen view is already open, do not animate it in
    dispatch(
      updateFullscreenStates({
        animateIn: !isFullscreenOpen,
        isAnimating: false
      })
    );
  };

  const videoFeedsContent = useMemo(() => {
    let content = (
      <div
        className={clsm([
          'bg-black',
          'flex',
          'h-full',
          'items-center',
          'justify-center'
        ])}
      >
        <Spinner variant="light" size="large" />
      </div>
    );
    if (
      isStageConnected &&
      streamMode === STREAM_MODES.REAL_TIME &&
      pathname === COLLABORATE_ROUTE_PATH
    ) {
      content = <StageVideoFeeds type={STAGE_VIDEO_FEEDS_TYPES.FULL_SCREEN} />;
    } else if (
      streamMode === STREAM_MODES.LOW_LATENCY &&
      pathname === '/manager'
    ) {
      content = <BroadcastFullScreenVideoFeed />;
    }

    return content;
  }, [isStageConnected, streamMode, pathname]);

  useFocusTrap([fullScreenViewContainerRef], !isModalOpen, {
    shouldReFocusBackOnLastClickedItem: true
  });

  return (
    <motion.div
      ref={fullScreenViewContainerRef}
      key="full-screen-view"
      {...createAnimationProps({
        customVariants: {
          hidden: {
            top: animationInitialPos.fullscreenTop,
            left: animationInitialPos.fullscreenLeft,
            width: animationInitialPos.fullscreenWidth,
            height: animationInitialPos.fullscreenHeight,
            borderRadius: 24
          },
          visible: {
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: 0,
            display: 'block'
          }
        },
        transition: FULLSCREEN_ANIMATION_TRANSITION,
        options: {
          isVisible: isFullscreenOpen,
          shouldAnimateIn: fullscreen.animateIn,
          shouldAnimate: fullscreen.animate
        }
      })}
      onAnimationStart={onAnimationStart}
      onAnimationComplete={onAnimationComplete}
      className={clsm([
        'absolute',
        'bg-lightMode-gray-extraLight',
        'dark:bg-darkMode-gray-dark',
        'overflow-hidden',
        'w-full',
        'h-full',
        'top-0',
        'left-0',
        shouldAddScrollbar && ['overflow-y-scroll', 'overflow-x-hidden'],
        isMobileView ? 'z-[300]' : 'z-[700]'
      ])}
    >
      {!collaborate.isJoining && <Header />}
      <motion.div
        className={clsm([
          'flex',
          'flex-col',
          'justify-between',
          'h-full',
          collaborate.isJoining && ['p-8', 'pb-0']
        ])}
        {...createAnimationProps({
          customVariants: {
            hidden: {
              paddingLeft: 20,
              paddingRight: 20,
              paddingBottom: 64,
              paddingTop: 72
            },
            visible: {
              paddingLeft: isMobileView ? 16 : 32,
              paddingRight: isMobileView ? 16 : 32,
              paddingBottom: 0,
              paddingTop: isMobileView ? 16 : 32
            }
          },
          transition: FULLSCREEN_ANIMATION_TRANSITION,
          options: {
            isVisible: isFullscreenOpen,
            shouldAnimateIn: fullscreen.animateIn
          }
        })}
      >
        {videoFeedsContent}
        <Footer shouldAddScrollbar={shouldAddScrollbar} />
      </motion.div>
    </motion.div>
  );
};

export default withPortal(FullScreenView, 'full-screen-view', {
  isAnimated: true,
  animationDuration: FULLSCREEN_ANIMATION_DURATION * 1000
});
