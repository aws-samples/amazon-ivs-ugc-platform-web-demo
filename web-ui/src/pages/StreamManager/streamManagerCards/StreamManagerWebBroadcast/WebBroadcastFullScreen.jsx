import { forwardRef, useEffect, useState, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion, useAnimationControls } from 'framer-motion';

import { CloseFullscreen, Settings } from '../../../../assets/icons';
import { clsm } from '../../../../utils';
import { createAnimationProps } from '../../../../helpers/animationPropsHelper';
import { fitRectIntoContainer } from '../../../../helpers/webBroadcastHelpers';
import { MODAL_TYPE, useModal } from '../../../../contexts/Modal';
import { streamManager as $content } from '../../../../content';
import Button from '../../../../components/Button';
import GoLiveStreamButton from './GoLiveStreamButton';
import useFocusTrap from '../../../../hooks/useFocusTrap';
import useResize from '../../../../hooks/useResize';
import WebBroadcastControl from './WebBroadcastControl';
import withPortal from '../../../../components/withPortal';

const $webBroadcastContent = $content.stream_manager_web_broadcast;
const animationDuration = 0.25;
const animationTransition = { duration: animationDuration, type: 'tween' };

const WebBroadcastFullScreen = forwardRef(
  (
    { dimensions, setIsFullScreenOpen, webBroadcastControllerButtons },
    previewRef
  ) => {
    const canvasControls = useAnimationControls();
    const { isModalOpen, openModal } = useModal();
    const [canvasDimensionClasses, setCanvasDimensionClasses] = useState([]);
    const canvasContainerRef = useRef();
    const settingsButtonRef = useRef();

    const webbroadcastfullscreenContainerRef = useRef();
    const {
      animationInitialWidth,
      animationInitialHeight,
      animationInitialLeft,
      animationInitialTop
    } = dimensions;

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

    useEffect(() => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const aspectRatioProportion = 0.667; // 3:2 aspect ratio or 2/3

      // Updating the initial dimensions of the canvas will make the canvas dimension animation smoother once the animation completes
      setCanvasDimensionClasses([
        'aspect-video',
        windowHeight / windowWidth < aspectRatioProportion
          ? ['w-auto', 'h-full']
          : ['w-full', 'h-auto']
      ]);
    }, []);

    const animateCanvasWidthHeight = useCallback(() => {
      const { width: newCanvasWidth, height: newCanvasHeight } =
        fitRectIntoContainer(
          previewRef.current.clientWidth,
          previewRef.current.clientHeight,
          canvasContainerRef.current.clientWidth,
          canvasContainerRef.current.clientHeight
        );

      canvasControls.start({
        width: newCanvasWidth,
        height: newCanvasHeight
      });
    }, [canvasControls, previewRef]);

    useFocusTrap([webbroadcastfullscreenContainerRef], !isModalOpen, {
      shouldReFocusBackOnLastClickedItem: true
    });
    useResize(animateCanvasWidthHeight);

    const handleOnClose = () => {
      setCanvasDimensionClasses([]);

      // Animate canvas dimensions back to initial values
      canvasControls.start({
        width: 311,
        height: 174.94,
        transition: animationTransition
      });
      setIsFullScreenOpen();
    };

    return (
      <motion.div
        ref={webbroadcastfullscreenContainerRef}
        key="fullScreenWebBroadcast"
        {...createAnimationProps({
          customVariants: {
            hidden: {
              top: animationInitialTop,
              left: animationInitialLeft,
              width: animationInitialWidth,
              height: animationInitialHeight,
              borderRadius: 24
            },
            visible: {
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderRadius: 0
            }
          },
          transition: animationTransition
        })}
        className={clsm([
          'absolute',
          'bg-lightMode-gray-extraLight',
          'dark:bg-darkMode-gray-dark',
          'overflow-hidden',
          'z-[700]'
        ])}
        onAnimationComplete={animateCanvasWidthHeight}
      >
        <motion.div
          className={clsm(['absolute', 'z-[100]'])}
          {...createAnimationProps({
            animations: ['fadeIn-full'],
            customVariants: {
              hidden: {
                top: 0,
                right: 0
              },
              visible: {
                top: 20,
                right: 20,
                transition: {
                  opacity: { delay: animationDuration }
                }
              }
            }
          })}
        >
          <Button
            ariaLabel={$webBroadcastContent.collapse}
            variant="icon"
            onClick={handleOnClose}
            className={clsm([
              '[&>svg]:fill-black',
              'bg-lightMode-gray',
              'dark:[&>svg]:fill-white',
              'dark:bg-darkMode-gray-medium',
              'h-11',
              'hover:bg-lightMode-gray-hover',
              'w-11'
            ])}
          >
            <CloseFullscreen />
          </Button>
        </motion.div>
        <motion.div
          className={clsm(['flex', 'flex-col', 'justify-between', 'h-full'])}
          {...createAnimationProps({
            customVariants: {
              hidden: {
                paddingLeft: 20,
                paddingRight: 20,
                paddingBottom: 64,
                paddingTop: 72
              },
              visible: {
                paddingLeft: 32,
                paddingRight: 32,
                paddingBottom: 0,
                paddingTop: 32
              }
            },
            transition: animationTransition
          })}
        >
          <motion.div
            ref={canvasContainerRef}
            className={clsm([
              'bg-black',
              'flex-col',
              'flex',
              'h-full',
              'items-center',
              'overflow-hidden',
              'relative',
              'rounded-xl',
              'w-full'
            ])}
          >
            <motion.canvas
              animate={canvasControls}
              ref={previewRef}
              className={clsm([
                '-translate-y-1/2',
                'absolute',
                'top-1/2',
                canvasDimensionClasses
              ])}
            />
          </motion.div>
          <div className={clsm(['flex', 'justify-center'])}>
            <motion.div
              {...createAnimationProps({
                customVariants: {
                  hidden: {
                    marginRight: 0
                  },
                  visible: {
                    marginRight: 138 // 1/2 width + space between buttons
                  }
                },
                transition: animationTransition
              })}
            >
              <WebBroadcastControl
                ref={settingsButtonRef}
                buttons={webBroadcastControllerWithSettingsButton}
                isOpen
              />
            </motion.div>
            <motion.div
              className={clsm(['absolute', 'bottom-5', 'w-full'])}
              {...createAnimationProps({
                customVariants: {
                  hidden: {
                    width: 311,
                    marginLeft: 0
                  },
                  visible: {
                    width: 140,
                    marginLeft: 280 // button width * 2
                  }
                },
                transition: animationTransition
              })}
            >
              <GoLiveStreamButton
                tooltipPosition="above"
                tooltipCustomTranslate={{ y: 2 }}
              />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    );
  }
);

WebBroadcastFullScreen.propTypes = {
  webBroadcastControllerButtons: PropTypes.array.isRequired,
  dimensions: PropTypes.shape({
    animationInitialWidth: PropTypes.number.isRequired,
    animationInitialHeight: PropTypes.number.isRequired,
    animationInitialLeft: PropTypes.number.isRequired,
    animationInitialTop: PropTypes.number.isRequired
  }).isRequired,
  setIsFullScreenOpen: PropTypes.func.isRequired
};

export default withPortal(WebBroadcastFullScreen, 'web-broadcast-full-screen', {
  isAnimated: true
});
