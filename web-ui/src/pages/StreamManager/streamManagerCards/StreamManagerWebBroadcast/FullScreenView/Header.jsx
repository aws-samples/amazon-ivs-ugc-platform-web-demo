import { motion } from 'framer-motion';

import { clsm } from '../../../../../utils';
import { createAnimationProps } from '../../../../../helpers/animationPropsHelper';
import Button from '../../../../../components/Button/Button';
import { CloseFullscreen, Close } from '../../../../../assets/icons';
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
    isHost,
    isInvitedParticipant
  } = useGlobalStage();
  const { handleOnConfirmLeaveStage, shouldGetHostRejoinTokenRef } =
    useStreamManagerStage();
  const { handleOnClose, setIsFullScreenViewOpen } = useBroadcastFullScreen();

  const shouldDisableCollapseButton =
    (isStageActive &&
      isInvitedParticipant &&
      shouldDisableStageButtonWithDelay) ||
    false;

  const icon = isHost || !isStageActive ? <CloseFullscreen /> : <Close />;

  const handleCloseFullScreen = useCallback(() => {
    if (isStageActive && isInvitedParticipant) {
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
    } else {
      handleOnClose();
    }
  }, [
    collaborateButtonAnimationControls,
    handleOnClose,
    handleOnConfirmLeaveStage,
    isHost,
    isInvitedParticipant,
    isStageActive,
    setIsFullScreenViewOpen,
    shouldGetHostRejoinTokenRef,
    stageId
  ]);

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
          isDisabled={shouldDisableCollapseButton}
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
      </Tooltip>
    </motion.div>
  );
};

export default Header;
