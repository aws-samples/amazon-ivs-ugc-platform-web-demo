import { motion } from 'framer-motion';
import { useRef } from 'react';

import { useStreamManagerStage } from '../../../../../contexts/Stage';
import { useResponsiveDevice } from '../../../../../contexts/ResponsiveDevice';
import { createAnimationProps } from '../../../../../helpers/animationPropsHelper';
import { clsm } from '../../../../../utils';
import { streamManager as $content } from '../../../../../content';
import BroadcastControlWrapper from '../BroadcastControl/BroadcastControlWrapper';
import {
  ANIMATION_DURATION,
  ANIMATION_TRANSITION,
  useBroadcastFullScreen
} from '../../../../../contexts/BroadcastFullscreen';
import GoLiveStreamButton from '../GoLiveStreamButton';
import Tooltip from '../../../../../components/Tooltip/Tooltip';
import Button from '../../../../../components/Button/Button';
import Spinner from '../../../../../components/Spinner';
import {
  CreateStage,
  LeaveSession,
  PersonAdd
} from '../../../../../assets/icons';
import { CONTROLLER_BUTTON_THEME } from '../BroadcastControl/BroadcastControllerTheme';
import { useGlobalStage } from '../../../../../contexts/Stage';

const $stageContent = $content.stream_manager_stage;

const Footer = () => {
  const leaveStageButtonRef = useRef();

  const {
    initializeStageClient,
    isStageActive,
    handleOnConfirmLeaveStage,
    handleCopyJoinParticipantLinkAndNotify,
    shouldDisableCollaborateButton,
    hasPermissions,
    shouldDisableCopyLinkButton
  } = useStreamManagerStage();
  const {
    collaborateButtonAnimationControls,
    shouldDisableStageButtonWithDelay,
    isCreatingStage
  } = useGlobalStage();
  const {
    setIsFullScreenViewOpen,
    shouldRenderFullScreenCollaborateButton,
    setShouldRenderFullScreenCollaborateButton
  } = useBroadcastFullScreen();
  const { isTouchscreenDevice } = useResponsiveDevice();

  const handleLeaveSession = () => {
    const closeFullscreenAndAnimateCollaborateButtonCallback = async () => {
      setIsFullScreenViewOpen(false);
      await collaborateButtonAnimationControls.start({
        zIndex: 1000,
        opacity: 1,
        transition: { duration: 0.45 }
      });
      collaborateButtonAnimationControls.start({ zIndex: 'unset' });
    };
    handleOnConfirmLeaveStage({
      closeFullscreenAndAnimateCollaborateButtonCallback,
      lastFocusedElementRef: leaveStageButtonRef
    });
  };

  const handleCreateStage = async () => {
    await initializeStageClient();
    setShouldRenderFullScreenCollaborateButton(false);
    collaborateButtonAnimationControls.start({
      zIndex: 0,
      opacity: 0
    });
  };

  const isCollaborateDisabled =
    shouldDisableCollaborateButton || !hasPermissions;

  return (
    <div className={clsm(['flex', 'justify-between'])}>
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
          transition: ANIMATION_TRANSITION
        })}
      >
        <BroadcastControlWrapper withSettingsButton isOpen />
      </motion.div>
      <motion.div
        className={clsm([
          'absolute',
          'bottom-5',
          'w-full',
          isStageActive && 'pointer-events-none'
        ])}
        {...createAnimationProps({
          customVariants: {
            hidden: {
              ...(isStageActive
                ? {
                    opacity: 0
                  }
                : {
                    width: 311,
                    marginLeft: 0,
                    opacity: 1
                  })
            },
            visible: {
              ...(!isStageActive && {
                width: 140,
                marginLeft: 'calc(50% - 90px)' // Calculate centering for the 'Go Live' button: 70px equals half button width + 20px left margin.
              })
            }
          },
          transition: ANIMATION_TRANSITION,
          options: {
            isVisible: !isStageActive
          }
        })}
      >
        <GoLiveStreamButton
          tooltipPosition="above"
          tooltipCustomTranslate={{ y: 2 }}
        />
      </motion.div>
      {shouldRenderFullScreenCollaborateButton && !isStageActive && (
        <div className={clsm(['flex', 'flex-col', 'justify-center'])}>
          <Tooltip
            key="stage-control-tooltip-collaborate"
            position="above"
            translate={{ y: 2 }}
            message={
              !isCollaborateDisabled && hasPermissions
                ? $stageContent.collaborate
                : $stageContent.notifications.error.permissions_denied
            }
          >
            <Button
              ariaLabel={$stageContent.collaborate}
              key="create-stage-control-btn"
              variant="icon"
              onClick={handleCreateStage}
              className={clsm([
                'w-11',
                'h-11',
                'dark:[&>svg]:fill-white',
                '[&>svg]:fill-black',
                'dark:bg-darkMode-gray',
                !isTouchscreenDevice && 'hover:bg-lightMode-gray-hover',
                'dark:focus:bg-darkMode-gray',
                'bg-lightMode-gray'
              ])}
              isDisabled={isCollaborateDisabled}
            >
              {isCreatingStage ? <Spinner variant="light" /> : <CreateStage />}
            </Button>
          </Tooltip>
        </div>
      )}

      {isStageActive && (
        <motion.div
          key="stage-full-screen-footer"
          className={clsm(['flex', 'items-center', 'space-x-4'])}
          {...createAnimationProps({
            animations: ['fadeIn-full'],
            customVariants: {
              visible: {
                transition: {
                  opacity: { delay: ANIMATION_DURATION }
                }
              }
            },
            options: {
              isVisible: isStageActive
            }
          })}
        >
          <Tooltip
            key="stage-control-tooltip-copy-link"
            position="above"
            translate={{ y: 2 }}
            message={
              !shouldDisableCopyLinkButton && $stageContent.copy_session_link
            }
          >
            <Button
              className={clsm(['px-4', 'w-full', CONTROLLER_BUTTON_THEME])}
              onClick={handleCopyJoinParticipantLinkAndNotify}
              variant="secondary"
              isDisabled={shouldDisableCopyLinkButton}
            >
              <PersonAdd className={clsm(['w-6', 'h-6', 'mr-2'])} />
              {$stageContent.copy_link}
            </Button>
          </Tooltip>
          <Tooltip
            key="stage-control-tooltip-leave"
            position="above"
            translate={{ y: 2 }}
            message={
              !shouldDisableStageButtonWithDelay && $stageContent.leave_session
            }
          >
            <Button
              ariaLabel={$stageContent.leave_session}
              ref={leaveStageButtonRef}
              isDisabled={shouldDisableStageButtonWithDelay}
              key="create-stage-control-btn"
              variant="icon"
              onClick={handleLeaveSession}
              disableHover={isTouchscreenDevice}
              className={clsm([
                'w-11',
                'h-11',
                'dark:[&>svg]:fill-white',
                '[&>svg]:fill-white',
                !isTouchscreenDevice && [
                  'hover:dark:bg-darkMode-red-hover',
                  'hover:bg-lightMode-red-hover'
                ],
                'dark:bg-darkMode-red',
                'bg-lightMode-red',
                'focus:bg-lightMode-red',
                'dark:focus:bg-darkMode-red'
              ])}
            >
              <LeaveSession />
            </Button>
          </Tooltip>
        </motion.div>
      )}
    </div>
  );
};

export default Footer;
