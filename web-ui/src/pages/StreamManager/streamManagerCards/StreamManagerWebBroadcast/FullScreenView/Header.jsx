import { motion } from 'framer-motion';

import { clsm } from '../../../../../utils';
import { createAnimationProps } from '../../../../../helpers/animationPropsHelper';
import Button from '../../../../../components/Button/Button';
import {
  CloseFullscreen as Collapse,
  Close
} from '../../../../../assets/icons';
import {
  ANIMATION_DURATION,
  useBroadcastFullScreen
} from '../../../../../contexts/BroadcastFullscreen';
import { streamManager as $content } from '../../../../../content';
import {
  useGlobalStage,
  useStreamManagerStage
} from '../../../../../contexts/Stage';
import { useCallback, useRef } from 'react';
import Tooltip from '../../../../../components/Tooltip';
import { useChannel } from '../../../../../contexts/Channel';

const $webBroadcastContent = $content.stream_manager_web_broadcast;
const $stageContent = $content.stream_manager_stage;

const Header = () => {
  const buttonRef = useRef();
  const { channelData } = useChannel();
  const { stageId } = channelData || {};
  const {
    isStageActive,
    collaborateButtonAnimationControls,
    shouldDisableStageButtonWithDelay,
    isHost
  } = useGlobalStage();
  const { handleOnConfirmLeaveStage, shouldGetHostRejoinTokenRef } =
    useStreamManagerStage();
  const { handleOnClose, setIsFullScreenViewOpen } = useBroadcastFullScreen();

  const isCollapseButton = isHost || !isStageActive;
  const isDisabled =
    (!isCollapseButton && shouldDisableStageButtonWithDelay) || false;

  const icon = isCollapseButton ? <Collapse /> : <Close />;

  const handleOnCloseAndLeaveStage = useCallback(() => {
    const closeFullscreenAndAnimateStreamButtonCallback = async () => {
      setIsFullScreenViewOpen(false);
      await collaborateButtonAnimationControls.start({
        zIndex: 1000,
        opacity: 1,
        transition: { duration: 0.45 }
      });
      collaborateButtonAnimationControls.start({ zIndex: 'unset' });
    };

    if (!isHost && !!stageId) shouldGetHostRejoinTokenRef.current = false;
    handleOnConfirmLeaveStage({
      closeFullscreenAndAnimateStreamButtonCallback,
      lastFocusedElementRef: buttonRef
    });
  }, [
    collaborateButtonAnimationControls,
    handleOnConfirmLeaveStage,
    isHost,
    setIsFullScreenViewOpen,
    shouldGetHostRejoinTokenRef,
    stageId
  ]);

  const handleCloseFullScreen = useCallback(() => {
    if (isCollapseButton) {
      handleOnClose();
    } else {
      handleOnCloseAndLeaveStage();
    }
  }, [handleOnClose, isCollapseButton, handleOnCloseAndLeaveStage]);

  return (
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
              opacity: { delay: ANIMATION_DURATION }
            }
          }
        }
      })}
    >
      <Tooltip
        position="below"
        translate={{ y: -2 }}
        message={
          isStageActive &&
          !isHost &&
          !shouldDisableStageButtonWithDelay &&
          $stageContent.leave_session
        }
      >
        <Button
          ref={buttonRef}
          isDisabled={isDisabled}
          ariaLabel={$webBroadcastContent.collapse}
          variant="icon"
          onClick={handleCloseFullScreen}
          className={clsm([
            '[&>svg]:fill-black',
            'bg-lightMode-gray',
            'dark:[&>svg]:fill-white',
            'dark:bg-darkMode-gray',
            'h-11',
            'hover:bg-lightMode-gray-hover',
            'w-11'
          ])}
        >
          {icon}
        </Button>
        {!isCollapseButton && (
          <div
            className={clsm([
              '-mt-11',
              'bg-lightMode-gray-extraLight',
              'dark:bg-darkMode-gray-dark',
              'h-11',
              'rounded-[50%]',
              'w-11',
              'pointer-events-none',
              isDisabled ? ['opacity-100', 'block'] : ['opacity-0', 'hidden']
            ])}
          />
        )}
      </Tooltip>
    </motion.div>
  );
};

export default Header;
