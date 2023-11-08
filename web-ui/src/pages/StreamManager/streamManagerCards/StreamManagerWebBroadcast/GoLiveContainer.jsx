import { forwardRef, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';

import {
  createAnimationProps,
  getDefaultBounceTransition
} from '../../../../helpers/animationPropsHelper';
import { BREAKPOINTS } from '../../../../constants';
import { clsm, noop } from '../../../../utils';
import { STAGE_VIDEO_FEEDS_TYPES } from './StageVideoFeeds/StageVideoFeeds';
import { StageControl } from './StageControl';
import { useBroadcastFullScreen } from '../../../../contexts/BroadcastFullscreen';
import { useBroadcast } from '../../../../contexts/Broadcast';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import { useGlobalStage, useStreamManagerStage } from '../../../../contexts/Stage';
import BroadcastControlWrapper from './BroadcastControl';
import FullScreenView from './FullScreenView/FullScreenView';
import GoLiveHeader from './GoLiveHeader';
import GoLiveStreamButton from './GoLiveStreamButton';
import StageVideoFeeds from './StageVideoFeeds';
import useLatest from '../../../../hooks/useLatest';
import { useLocation } from 'react-router-dom';

const GoLiveContainer = forwardRef(
  ({ isOpen, onCollapse, setIsWebBroadcastAnimating }, previewRef) => {
    const { isBroadcasting } = useBroadcast();
    const { isDesktopView, currentBreakpoint, isTouchscreenDevice } =
      useResponsiveDevice();
    const { isStageActive } = useStreamManagerStage();
    const { isFullScreenViewOpen, dimensions } = useBroadcastFullScreen();
    const shouldAnimateStreamingButton = useLatest(false);
    const shouldShowTooltipMessageRef = useRef();
    const goLiveContainerVideoContainerRef = useRef();
    const { isJoiningStageByRequest, isJoiningStageByInvite } = useGlobalStage()

    const handleOnCollapse = () => {
      shouldAnimateStreamingButton.current = false;
      if (isBroadcasting) shouldAnimateStreamingButton.current = true;
      onCollapse();
    };

    const onAnimationComplete = () => {
      setIsWebBroadcastAnimating(false);
      shouldShowTooltipMessageRef.current = true;
    };

    const onAnimationStart = () => {
      setIsWebBroadcastAnimating(true);
      shouldShowTooltipMessageRef.current = false;
    };

    const { state } = useLocation();

    const shouldAddRef = !isFullScreenViewOpen || isJoiningStageByRequest || isJoiningStageByInvite
    console.log('shouldAddRef', shouldAddRef)
    console.log('previewRef', previewRef)
    return (
      <>
        <AnimatePresence initial={false}>
          <motion.div
            key="web-broadcast"
            {...(isDesktopView &&
              createAnimationProps({
                animations: ['fadeIn-full'],
                transition: 'bounce',
                customVariants: {
                  hidden: {
                    height: 0,
                    transitionEnd: { display: 'none' }
                  },
                  visible: {
                    height: 'auto',
                    display: 'block',
                    transition: {
                      ...getDefaultBounceTransition(isOpen),
                      opacity: { delay: 0.25 }
                    }
                  }
                },
                options: {
                  ...(isDesktopView
                    ? { isVisible: isOpen }
                    : { isVisible: true })
                }
              }))}
            onAnimationStart={onAnimationStart}
            onAnimationComplete={onAnimationComplete}
          >
            {!state?.isJoiningStageByRequest && isDesktopView && (
              <GoLiveHeader onCollapse={handleOnCollapse} />
            )}
            <div ref={goLiveContainerVideoContainerRef} className="relative">
              {isStageActive ? (
                <div className={clsm(['flex', 'aspect-video'])}>
                  <StageVideoFeeds type={STAGE_VIDEO_FEEDS_TYPES.GO_LIVE} />
                </div>
              ) : (
                <canvas
                  ref={
                    shouldAddRef
                      ? previewRef
                      : null
                  }
                  className={clsm(['aspect-video', 'rounded-xl', 'w-full'])}
                  aria-label="Amazon IVS web broadcast video and audio stream"
                />
              )}
            </div>

            <div
              className={clsm([
                'relative',
                'flex',
                'flex-row',
                'justify-between',
                ((isDesktopView && !isTouchscreenDevice) ||
                  currentBreakpoint === BREAKPOINTS.xs) &&
                  'justify-start',
                !isOpen && isDesktopView && 'hidden'
              ])}
            >
              <div
                className={clsm([
                  'flex',
                  'justify-center',
                  'w-full',
                  (!isTouchscreenDevice ||
                    currentBreakpoint === BREAKPOINTS.xxs) &&
                    'pr-[6px]'
                ])}
              >
                <BroadcastControlWrapper isOpen={isOpen} withSettingsButton />
              </div>
              {!state?.isJoiningStageByRequest && (
                <StageControl
                  goLiveContainerVideoContainerRef={
                    goLiveContainerVideoContainerRef
                  }
                />
              )}
            </div>
          </motion.div>
          {(isOpen || !isDesktopView) && (
            <motion.div
              className={clsm(!isStageActive && '!w-full')}
              {...createAnimationProps({
                customVariants: {
                  hidden: {
                    clipPath: 'inset(0 0 0 100%)'
                  },
                  visible: {
                    clipPath: 'inset(0 0 0 0%)'
                  }
                },
                options: {
                  shouldAnimate:
                    shouldAnimateStreamingButton.current && !isBroadcasting
                }
              })}
            >
              <GoLiveStreamButton
                tooltipPosition="below"
                tooltipCustomTranslate={{ y: -2 }}
                shouldShowTooltipMessage={shouldShowTooltipMessageRef.current}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {isFullScreenViewOpen && (
            <FullScreenView
              isOpen={isFullScreenViewOpen}
              parentEl={document.body}
              dimensions={dimensions}
            />
          )}
        </AnimatePresence>
      </>
    );
  }
);

GoLiveContainer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onCollapse: PropTypes.func.isRequired,
  setIsWebBroadcastAnimating: PropTypes.func
};

GoLiveContainer.defaultProps = {
  setIsWebBroadcastAnimating: noop
};

export default GoLiveContainer;
