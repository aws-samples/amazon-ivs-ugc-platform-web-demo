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
import { useBroadcast } from '../../../../contexts/Broadcast';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import {
  useGlobalStage,
  useStreamManagerStage
} from '../../../../contexts/Stage';
import BroadcastControlWrapper from './BroadcastControl';
import GoLiveHeader from './GoLiveHeader';
import GoLiveStreamButton from './GoLiveStreamButton';
import StageVideoFeeds from './StageVideoFeeds';
import useLatest from '../../../../hooks/useLatest';
import { useBroadcastFullScreen } from '../../../../contexts/BroadcastFullscreen';

const GoLiveContainer = forwardRef(
  (
    {
      isOpen,
      onCollapse,
      setIsWebBroadcastAnimating,
      withHeader,
      withScreenshareButton,
      withStageControl,
      goliveButtonClassNames
    },
    previewRef
  ) => {
    const { isBroadcasting } = useBroadcast();
    const { isDesktopView, currentBreakpoint, isTouchscreenDevice } =
      useResponsiveDevice();
    const { isStageActive } = useStreamManagerStage();
    const {
      goLiveButtonRef,
      broadcastControllerRef,
      isFullScreenViewOpen,
      collapsedContainerRef: goLiveCollapsedContainerRef
    } = useBroadcastFullScreen();
    const { isHost } = useGlobalStage();
    const shouldAnimateStreamingButton = useLatest(false);
    const shouldShowTooltipMessageRef = useRef();

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
            {((withHeader && isDesktopView) || (isStageActive && isHost)) && (
              <GoLiveHeader onCollapse={handleOnCollapse} />
            )}
            <div ref={goLiveCollapsedContainerRef} className="relative">
              {isStageActive && !isFullScreenViewOpen ? (
                <div className={clsm(['flex', 'aspect-video'])}>
                  <StageVideoFeeds type={STAGE_VIDEO_FEEDS_TYPES.GO_LIVE} />
                </div>
              ) : (
                <canvas
                  ref={previewRef}
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
                <BroadcastControlWrapper
                  ref={broadcastControllerRef}
                  isOpen={isOpen}
                  withSettingsButton
                  withScreenshareButton={withScreenshareButton}
                />
              </div>
              {withStageControl && (
                <StageControl
                  goLiveContainerVideoContainerRef={goLiveCollapsedContainerRef}
                />
              )}
            </div>
          </motion.div>
          {(isOpen || !isDesktopView) && (
            <motion.div
              ref={goLiveButtonRef}
              key="go-live-button"
              className={clsm([
                !isStageActive && '!w-full',
                goliveButtonClassNames
              ])}
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
      </>
    );
  }
);

GoLiveContainer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onCollapse: PropTypes.func.isRequired,
  setIsWebBroadcastAnimating: PropTypes.func,
  withHeader: PropTypes.bool,
  withStageControl: PropTypes.bool,
  withScreenshareButton: PropTypes.bool,
  goliveButtonClassNames: PropTypes.string
};

GoLiveContainer.defaultProps = {
  setIsWebBroadcastAnimating: noop,
  withHeader: true,
  withScreenshareButton: true,
  withStageControl: true,
  goliveButtonClassNames: '',
  onCollapse: noop
};

export default GoLiveContainer;
