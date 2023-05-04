import { useRef } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

import { ChevronDown, Stop } from '../../../../assets/icons';
import { clsm } from '../../../../utils';
import { createAnimationProps } from '../../../../helpers/animationPropsHelper';
import { streamManager as $content } from '../../../../content';
import { useBroadcast } from '../../../../contexts/Broadcast';
import { useModal } from '../../../../contexts/Modal';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import Button from '../../../../components/Button';
import WebBroadcastControl from './WebBroadcastControl';

const $webBroadcastContent = $content.stream_manager_web_broadcast;

const createAnimationWithDelay = (delay = 0.25) =>
  createAnimationProps({
    animations: ['fadeIn-full'],
    customVariants: {
      hidden: {
        opacity: 0
      },
      visible: {
        transition: {
          opacity: { delay }
        }
      }
    }
  });

const GoLiveContainerCollapsed = ({
  onExpand,
  isOpen,
  webBroadcastControllerButtons
}) => {
  const { isTouchscreenDevice } = useResponsiveDevice();
  const { stopBroadcast } = useBroadcast();
  const stopBroadcastButtonRef = useRef();
  const { openModal } = useModal();

  const handleStopBroadcastingAction = () => {
    openModal({
      content: {
        confirmText: $webBroadcastContent.end_stream,
        message: $webBroadcastContent.confirm_end_stream,
        isDestructive: true
      },
      onConfirm: () => {
        stopBroadcast();
        onExpand();
      },
      lastFocusedElement: stopBroadcastButtonRef
    });
  };

  return (
    <div
      className={clsm([
        'w-full',
        'h-8',
        'flex',
        'justify-end',
        'items-center',
        '[&>svg]:fill-black',
        'dark:[&>svg]:fill-white'
      ])}
    >
      <div className={clsm(['absolute', 'top-5', 'left-5'])}>
        <Button
          onClick={onExpand}
          variant="primaryText"
          className={clsm([
            'p-1',
            'pt-1.5',
            'min-w-0',
            'dark:[&>svg]:fill-white',
            'dark:focus:none',
            '[&>svg]:fill-black',
            'h-8',
            'focus:bg-transparent',
            'focus:dark:bg-transparent',
            '[&>svg]:w-6',
            '[&>svg]:h-6'
          ])}
        >
          <ChevronDown onClick={onExpand} />
        </Button>
      </div>
      <div className={clsm(['flex', 'items-center'])}>
        <motion.div {...createAnimationWithDelay()}>
          <WebBroadcastControl
            isOpen={isOpen}
            buttons={webBroadcastControllerButtons}
          />
        </motion.div>
        <motion.div {...createAnimationWithDelay(0.1)}>
          <Button
            ref={stopBroadcastButtonRef}
            onClick={handleStopBroadcastingAction}
            className={clsm([
              'w-[72px]',
              'min-w-0',
              'bg-darkMode-red',
              'ml-3',
              'dark:bg-darkMode-red',
              'bg-darkMode-red',
              !isTouchscreenDevice && [
                'hover:dark:bg-darkMode-red-hover',
                'hover:bg-darkMode-red-hover'
              ],
              'focus:bg-darkMode-red'
            ])}
          >
            <motion.div
              {...createAnimationWithDelay()}
              className={clsm([
                '[&>svg]:h-7',
                '[&>svg]:w-7',
                '[&>svg]:fill-black'
              ])}
            >
              <Stop />
            </motion.div>
          </Button>
        </motion.div>
      </div>
    </div>
  );
};
GoLiveContainerCollapsed.propTypes = {
  onExpand: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  webBroadcastControllerButtons: PropTypes.array.isRequired
};

export default GoLiveContainerCollapsed;
