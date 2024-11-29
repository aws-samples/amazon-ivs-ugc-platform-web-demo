import { forwardRef, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import { createAnimationProps } from '../../../../helpers/animationPropsHelper';
import { BREAKPOINTS, PARTICIPANT_TYPES } from '../../../../constants';
import { clsm, noop } from '../../../../utils';
import { STAGE_VIDEO_FEEDS_TYPES } from './StageVideoFeeds/StageVideoFeeds';
import { GoLiveStageControl } from './StageControl';
import { useBroadcast } from '../../../../contexts/Broadcast';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import BroadcastControlWrapper from './BroadcastControl';
import GoLiveHeader from './GoLiveHeader';
import GoLiveStreamButton from './GoLiveStreamButton';
import StageVideoFeeds from './StageVideoFeeds';
import useLatest from '../../../../hooks/useLatest';
import { useStageManager } from '../../../../contexts/StageManager';
import Spinner from '../../../../components/Spinner';
import StageJoinVideo from './StageJoinVideo';
import { updateAnimationInitialStates } from '../../../../reducers/streamManager';
import PreviewVideo from './PreviewVideo';

const ExpandedGoLiveContainer = forwardRef(
  (
    {
      isOpen,
      onCollapse,
      setIsWebBroadcastAnimating,
      withHeader,
      withScreenshareButton,
      withStageControl,
      goliveButtonClassNames,
      onExpandAnimationComplete,
      onGoLiveStreamButtonClick
    },
    previewRef
  ) => {
    const dispatch = useDispatch();
    const {
      fullscreen: { isOpen: isFullscreenOpen }
    } = useSelector((state) => state.streamManager);
    const { collaborate } = useSelector((state) => state.shared);
    const { isBroadcasting } = useBroadcast();
    const { isDesktopView, currentBreakpoint, isTouchscreenDevice } =
      useResponsiveDevice();
    const { user: userStage = null } = useStageManager() || {};
    const isStageActive = userStage?.isConnected;
    const isHost = collaborate.participantType === PARTICIPANT_TYPES.HOST;

    // Refs
    const shouldAnimateStreamingButton = useLatest(false);
    const shouldShowTooltipMessageRef = useRef();
    const goLiveContainerRef = useRef();
    const broadcastControlWrapperRef = useRef();

    const handleOnCollapse = () => {
      shouldAnimateStreamingButton.current = false;
      if (isBroadcasting) shouldAnimateStreamingButton.current = true;
      onCollapse();
    };

    const onAnimationComplete = () => {
      onExpandAnimationComplete();

      setIsWebBroadcastAnimating(false);
      shouldShowTooltipMessageRef.current = true;
    };

    const onAnimationStart = () => {
      setIsWebBroadcastAnimating(true);
      shouldShowTooltipMessageRef.current = false;
    };

    /**
     * The preview video element switches based on whether the preview is
     * in low latency, real-time and also when joining a collaborate session
     */
    const previewVideoElement = useMemo(() => {
      let element = (
        <div
          className={clsm([
            'flex',
            'justify-center',
            'align-center',
            'aspect-video'
          ])}
        >
          <Spinner variant="light" size="large" />
        </div>
      );

      if (isStageActive && !isFullscreenOpen) {
        element = (
          <div className={clsm(['flex', 'aspect-video'])}>
            <StageVideoFeeds type={STAGE_VIDEO_FEEDS_TYPES.GO_LIVE} />
          </div>
        );
      } else if (collaborate.isJoining) {
        element = <StageJoinVideo />;
      } else {
        element = <PreviewVideo previewRef={previewRef} />;
      }

      return element;
    }, [collaborate.isJoining, isFullscreenOpen, isStageActive, previewRef]);

    useEffect(() => {
      if (
        !isOpen ||
        !goLiveContainerRef.current ||
        !broadcastControlWrapperRef.current
      )
        return;

      /**
       * When the GoLive container opens,
       * Get the GoLive button width and broadcast controller margin left
       * Wrapped logic in a set timeout in order to make sure the elements
       * are fully rendered before catching the values
       */

      const timeoutId = setTimeout(() => {
        const goLiveButtonWidth = goLiveContainerRef.current.clientWidth;
        const broadcastControllerMarginLeft =
          broadcastControlWrapperRef.current.offsetLeft;

        dispatch(
          updateAnimationInitialStates({
            goLiveButtonWidth,
            broadcastControllerMarginLeft
          })
        );
      }, 0);

      return () => clearTimeout(timeoutId);
    }, [dispatch, goLiveContainerRef, broadcastControlWrapperRef, isOpen]);

    return (
      <>
        <AnimatePresence initial={false}>
          <motion.div
            key="web-broadcast"
            {...(isDesktopView &&
              createAnimationProps({
                animations: ['fadeIn-full'],
                transition: {
                  height: {
                    duration: 0.3
                  },
                  opacity: { duration: 0.1 }
                },
                customVariants: {
                  hidden: {
                    height: 0
                  },
                  visible: {
                    height: 'auto',
                    transition: {
                      opacity: { delay: 0.25 }
                    }
                  }
                },
                options: {
                  isVisible: isDesktopView ? isOpen : true
                }
              }))}
            onAnimationStart={onAnimationStart}
            onAnimationComplete={onAnimationComplete}
          >
            {((withHeader && isDesktopView) || (isStageActive && isHost)) && (
              <GoLiveHeader onCollapse={handleOnCollapse} />
            )}
            <div className="relative">{previewVideoElement}</div>
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
                  ref={broadcastControlWrapperRef}
                  isOpen={isOpen}
                  withSettingsButton
                  withScreenshareButton={withScreenshareButton}
                />
              </div>
              {withStageControl && <GoLiveStageControl />}
            </div>
          </motion.div>
          {(isOpen || !isDesktopView) && (
            <motion.div
              ref={goLiveContainerRef}
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
                onClick={onGoLiveStreamButtonClick}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }
);

ExpandedGoLiveContainer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onCollapse: PropTypes.func.isRequired,
  setIsWebBroadcastAnimating: PropTypes.func,
  withHeader: PropTypes.bool,
  withStageControl: PropTypes.bool,
  withScreenshareButton: PropTypes.bool,
  goliveButtonClassNames: PropTypes.string,
  onExpandAnimationComplete: PropTypes.func,
  onGoLiveStreamButtonClick: PropTypes.func
};

ExpandedGoLiveContainer.defaultProps = {
  setIsWebBroadcastAnimating: noop,
  withHeader: true,
  withScreenshareButton: true,
  withStageControl: true,
  goliveButtonClassNames: '',
  onCollapse: noop,
  onExpandAnimationComplete: noop,
  onGoLiveStreamButtonClick: null
};

export default ExpandedGoLiveContainer;
