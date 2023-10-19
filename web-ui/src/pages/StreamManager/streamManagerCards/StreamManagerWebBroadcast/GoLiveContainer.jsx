import { forwardRef, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';

import {
  createAnimationProps,
  getDefaultBounceTransition
} from '../../../../helpers/animationPropsHelper';
import { clsm, noop } from '../../../../utils';
import { STAGE_VIDEO_FEEDS_TYPES } from './StageVideoFeeds/StageVideoFeeds';
import {
  STREAM_BUTTON_ANIMATION_DURATION,
  useBroadcastFullScreen
} from '../../../../contexts/BroadcastFullscreen';
import { useBroadcast } from '../../../../contexts/Broadcast';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import { useStreamManagerStage } from '../../../../contexts/Stage';
import BroadcastControlWrapper from './BroadcastControl';
import FullScreenView from './FullScreenView/FullScreenView';
import GoLiveHeader from './GoLiveHeader';
import GoLiveStreamButton from './GoLiveStreamButton';
import StageControl from './StageControl';
import StageVideoFeeds from './StageVideoFeeds';
import useLatest from '../../../../hooks/useLatest';
import { useGlobalStage } from '../../../../contexts/Stage';

const GoLiveContainer = forwardRef(
  ({ isOpen, onCollapse, setIsWebBroadcastAnimating }, previewRef) => {
    const { isBroadcasting } = useBroadcast();
    const { isDesktopView, currentBreakpoint } = useResponsiveDevice();
    const { isStageActive } = useStreamManagerStage();
    const { animateCollapseStageContainerWithDelay } = useGlobalStage();

    const { isFullScreenViewOpen, dimensions } = useBroadcastFullScreen();
    const shouldAnimateStreamingButton = useLatest(false);
    const shouldShowTooltipMessageRef = useRef();

    const handleOnCollapse = () => {
      shouldAnimateStreamingButton.current = false;
      if (isBroadcasting) shouldAnimateStreamingButton.current = true;
      onCollapse();
    };

    const controllerCalculatedWidth = currentBreakpoint
      ? `w-[calc(100%_-_44px_-_32px_+_1px)]` // Width of icon (44px) - Divider padding (32px) + Divider width (1px)
      : `w-[calc(100%_-_44px_-_16px_+_1px)]`; // Width of icon (44px) - Divider padding (16px for xs screens) + Divider width (1px)

    const startStreamButtonAnimationProps = useMemo(
      () =>
        isStageActive
          ? createAnimationProps({
              customVariants: {
                hidden: {
                  width: '100%'
                },
                visible: {
                  width: 'calc(100% - 44px - 32px + 1px)'
                },
                transition: {
                  duration: STREAM_BUTTON_ANIMATION_DURATION
                }
              },
              options: {
                isVisible: animateCollapseStageContainerWithDelay
              }
            })
          : createAnimationProps({
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
            }),
      [
        isStageActive,
        animateCollapseStageContainerWithDelay,
        isBroadcasting,
        shouldAnimateStreamingButton
      ]
    );

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
            className={!isStageActive ? 'overflow-hidden' : undefined}
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
            {isDesktopView && <GoLiveHeader onCollapse={handleOnCollapse} />}
            {isStageActive ? (
              <div className={clsm(['flex', 'aspect-video'])}>
                <StageVideoFeeds type={STAGE_VIDEO_FEEDS_TYPES.GO_LIVE} />
              </div>
            ) : (
              <canvas
                ref={!isFullScreenViewOpen ? previewRef : null}
                className={clsm(['aspect-video', 'rounded-xl', 'w-full'])}
                aria-label="Amazon IVS web broadcast video and audio stream"
              />
            )}

            <div
              className={clsm([
                'relative',
                'flex',
                'flex-row',
                !isOpen && isDesktopView && 'hidden'
              ])}
            >
              <div
                className={clsm([
                  'flex',
                  'justify-center',
                  controllerCalculatedWidth
                ])}
              >
                <BroadcastControlWrapper isOpen={isOpen} withSettingsButton />
              </div>
              <StageControl />
            </div>
          </motion.div>
          {(isOpen || !isDesktopView) && (
            <motion.div
              className={clsm(!isStageActive && '!w-full')}
              {...startStreamButtonAnimationProps}
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
          {isFullScreenViewOpen && isDesktopView && (
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
