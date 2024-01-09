import { forwardRef, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';

import {
  createAnimationProps,
  getDefaultBounceTransition
} from '../../../../helpers/animationPropsHelper';
import { clsm, noop } from '../../../../utils';
import { Settings } from '../../../../assets/icons';
import { streamManager as $content } from '../../../../content';
import { useBroadcast } from '../../../../contexts/Broadcast';
import { useModal, MODAL_TYPE } from '../../../../contexts/Modal';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import useLatest from '../../../../hooks/useLatest';
import GoLiveHeader from './GoLiveHeader';
import GoLiveStreamButton from './GoLiveStreamButton';
import WebBroadcastControl from './WebBroadcastControl';

const $webBroadcastContent = $content.stream_manager_web_broadcast;

const GoLiveContainer = forwardRef(
  (
    {
      isBroadcastCardOpen,
      isOpen,
      onCollapse,
      setIsWebBroadcastAnimating,
      webBroadcastContainerRef,
      webBroadcastControllerButtons,
      webBroadcastParentContainerRef
    },
    previewRef
  ) => {
    const [isFullScreen, setIsFullScreen] = useState(false);
    const settingsButtonRef = useRef();
    const shouldAnimateStreamingButton = useLatest(false);
    const { isBroadcasting } = useBroadcast();
    const { openModal } = useModal();
    const { isDesktopView } = useResponsiveDevice();

    const handleOnCollapse = () => {
      shouldAnimateStreamingButton.current = false;
      if (isBroadcasting) shouldAnimateStreamingButton.current = true;
      onCollapse();
    };

    const handleSettingsClick = () => {
      openModal({
        type: MODAL_TYPE.STREAM_BROADCAST_SETTINGS,
        lastFocusedElement: settingsButtonRef
      });
    };

    const webBroadcastControllerWithSettingsButton = [
      ...webBroadcastControllerButtons,
      {
        onClick: handleSettingsClick,
        ariaLabel: 'Open video and audio settings modal',
        withRef: true,
        icon: <Settings />,
        tooltip: $webBroadcastContent.open_settings
      }
    ];

    return (
      <AnimatePresence initial={false}>
        <motion.div
          key="webBroadcast"
          className="overflow-hidden"
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
                isVisible: isOpen
              }
            }))}
          onAnimationStart={() => setIsWebBroadcastAnimating(true)}
          onAnimationComplete={() => setIsWebBroadcastAnimating(false)}
        >
          {isDesktopView && (
            <GoLiveHeader
              ref={previewRef}
              onCollapse={handleOnCollapse}
              isFullScreen={isFullScreen}
              setIsFullScreen={setIsFullScreen}
              webBroadcastControllerButtons={webBroadcastControllerButtons}
              webBroadcastParentContainerRef={webBroadcastParentContainerRef}
              webBroadcastContainerRef={webBroadcastContainerRef}
            />
          )}
          <canvas
            ref={!isFullScreen ? previewRef : null}
            className={clsm(['aspect-video', 'rounded-xl', 'w-full'])}
          />
          <WebBroadcastControl
            ref={settingsButtonRef}
            isOpen={isOpen}
            buttons={webBroadcastControllerWithSettingsButton}
          />
        </motion.div>
        {(isOpen || !isDesktopView) && (
          <motion.div
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
              onCollapse={onCollapse}
            />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

GoLiveContainer.propTypes = {
  isBroadcastCardOpen: PropTypes.bool.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onCollapse: PropTypes.func.isRequired,
  setIsWebBroadcastAnimating: PropTypes.func,
  webBroadcastContainerRef: PropTypes.object.isRequired,
  webBroadcastControllerButtons: PropTypes.array.isRequired,
  webBroadcastParentContainerRef: PropTypes.object.isRequired
};

GoLiveContainer.defaultProps = {
  setIsWebBroadcastAnimating: noop
};

export default GoLiveContainer;
