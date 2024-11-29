import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';

import { clsm } from '../../../../../utils';
import { createAnimationProps } from '../../../../../helpers/animationPropsHelper';
import Button from '../../../../../components/Button/Button';
import {
  CloseFullscreen as Collapse,
  Close
} from '../../../../../assets/icons';
import { streamManager as $content } from '../../../../../content';
import { useCallback, useRef } from 'react';
import Tooltip from '../../../../../components/Tooltip';
import { useStageManager } from '../../../../../contexts/StageManager';
import {
  initializeFullscreenClose,
  updateFullscreenStates
} from '../../../../../reducers/streamManager';
import {
  FULLSCREEN_ANIMATION_DURATION,
  PARTICIPANT_TYPES
} from '../../../../../constants';

const $webBroadcastContent = $content.stream_manager_web_broadcast;
const $stageContent = $content.stream_manager_stage;

const Header = () => {
  const dispatch = useDispatch();
  const { collaborate } = useSelector((state) => state.shared);
  const buttonRef = useRef();
  const { user: userStage = null, stageControls } = useStageManager() || {};
  const { leaveStage } = stageControls || {};

  const isStageActive = userStage?.isConnected;
  const isHost = collaborate.participantType === PARTICIPANT_TYPES.HOST;
  const isCollapseButtonVisible = isHost || !isStageActive; // else, display close button

  const handleOnCloseAndLeaveStage = useCallback(async () => {
    dispatch(
      updateFullscreenStates({
        isOpen: false,
        animate: true
      })
    );
    await leaveStage();
  }, [dispatch, leaveStage]);

  const handleCloseFullScreen = useCallback(() => {
    if (isCollapseButtonVisible) {
      dispatch(initializeFullscreenClose());
    } else {
      handleOnCloseAndLeaveStage();
    }
  }, [isCollapseButtonVisible, dispatch, handleOnCloseAndLeaveStage]);

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
              opacity: { delay: FULLSCREEN_ANIMATION_DURATION }
            }
          }
        }
      })}
    >
      <Tooltip
        position="below"
        translate={{ y: -2 }}
        message={isStageActive && !isHost && $stageContent.leave_session}
      >
        <Button
          ref={buttonRef}
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
          {isCollapseButtonVisible ? <Collapse /> : <Close />}
        </Button>
        {!isCollapseButtonVisible && (
          <div
            className={clsm([
              '-mt-11',
              'bg-lightMode-gray-extraLight',
              'dark:bg-darkMode-gray-dark',
              'h-11',
              'rounded-[50%]',
              'w-11',
              'pointer-events-none',
              ['opacity-0', 'hidden']
            ])}
          />
        )}
      </Tooltip>
    </motion.div>
  );
};

export default Header;
