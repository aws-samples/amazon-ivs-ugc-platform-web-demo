import { motion, AnimatePresence } from 'framer-motion';
import { useRef } from 'react';

import { clsm } from '../../../../utils';
import { createAnimationProps } from '../../../../helpers/animationPropsHelper';
import { CreateStage, LeaveSession, PersonAdd } from '../../../../assets/icons';
import { streamManager as $content } from '../../../../content';
import { useBroadcastFullScreen } from '../../../../contexts/BroadcastFullscreen';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import { useStage } from '../../../../contexts/Stage/Stage';
import Button from '../../../../components/Button/Button';
import Spinner from '../../../../components/Spinner';
import Tooltip from '../../../../components/Tooltip/Tooltip';

const $stageContent = $content.stream_manager_stage;
const {
  notifications: {
    error: { permissions_denied }
  }
} = $content.stream_manager_stage;

const ANIMATION_TRANSITION = {
  delay: 0.1,
  duration: 0.1
};

const StageControl = () => {
  const leaveStageButtonRef = useRef();

  const { isTouchscreenDevice, isDesktopView } = useResponsiveDevice();

  const {
    initializeStageClient,
    isStageActive,
    isCreatingStage,
    animateCollapseStageContainerWithDelay,
    updateAnimateCollapseStageContainerWithDelay,
    collaborateButtonAnimationControls,
    handleOnConfirmLeaveStage,
    shouldDisableStageButtonWithDelay,
    handleCopyJoinParticipantLinkAndNotify,
    shouldDisableCollaborateButton,
    hasPermissions,
    shouldDisableCopyLinkButton
  } = useStage();
  const { handleToggleFullscreen } = useBroadcastFullScreen();
  const isCollaborateDisabled =
    shouldDisableCollaborateButton ||
    !hasPermissions ||
    shouldDisableCopyLinkButton;

  let collaborateButtonContent;

  if (!hasPermissions) collaborateButtonContent = permissions_denied;
  else
    collaborateButtonContent = animateCollapseStageContainerWithDelay
      ? $stageContent.copy_session_link
      : $stageContent.collaborate;

  let icon;

  if (isCreatingStage) {
    icon = <Spinner variant="light" />;
  } else {
    icon = animateCollapseStageContainerWithDelay ? (
      <AnimatePresence>
        <motion.div
          className={clsm([
            'dark:[&>svg]:fill-white',
            '[&>svg]:fill-black',
            '[&>svg]:w-6',
            '[&>svg]:h-6'
          ])}
          {...createAnimationProps({
            transition: { type: 'easeInOut', from: 0.6, duration: 0.8 },
            controls: { opacity: 1 }
          })}
        >
          <PersonAdd />
        </motion.div>
      </AnimatePresence>
    ) : (
      <CreateStage />
    );
  }

  const handleOpenStageFullScreen = () => {
    if (isStageActive) return;

    const openFullscreenViewCallback = () => {
      if (isDesktopView) {
        collaborateButtonAnimationControls.start({
          zIndex: 0,
          opacity: 0
        });
        handleToggleFullscreen();
      } else {
        updateAnimateCollapseStageContainerWithDelay(true);
      }
    };

    initializeStageClient(openFullscreenViewCallback);
  };

  return (
    <motion.div
      className={clsm([
        'grid',
        'gap-5',
        'mt-5',
        'absolute',
        'right-0',
        'top-1',
        'pl-4',
        'xs:pl-[7px]',
        'ml-4',
        'xs:ml-1',
        'border-l-[1px]',
        'border-darkMode-gray-medium'
      ])}
      {...createAnimationProps({
        customVariants: {
          hidden: {
            height: 36
          },
          visible: {
            height: 'auto',
            transition: ANIMATION_TRANSITION
          }
        },
        options: {
          isVisible: animateCollapseStageContainerWithDelay
        }
      })}
    >
      <Tooltip
        key="stage-control-tooltip-collaborate"
        position="above"
        translate={{ y: 6 }}
        message={
          !shouldDisableCollaborateButton &&
          !shouldDisableCopyLinkButton &&
          collaborateButtonContent
        }
      >
        <AnimatePresence>
          <motion.div
            style={{ position: 'inherit' }}
            animate={collaborateButtonAnimationControls}
          >
            <Button
              ariaLabel={collaborateButtonContent}
              key="create-stage-control-btn"
              variant="icon"
              onClick={
                isStageActive
                  ? handleCopyJoinParticipantLinkAndNotify
                  : handleOpenStageFullScreen
              }
              isDisabled={isCollaborateDisabled}
              disableHover={isTouchscreenDevice}
              className={clsm([
                '-mt-1',
                'w-11',
                'h-11',
                'dark:[&>svg]:fill-white',
                '[&>svg]:fill-black',
                'dark:bg-darkMode-gray',
                !isTouchscreenDevice && 'hover:bg-lightMode-gray-hover',
                'dark:focus:bg-darkMode-gray',
                'bg-lightMode-gray'
              ])}
            >
              {icon}
            </Button>
          </motion.div>
        </AnimatePresence>
      </Tooltip>
      <AnimatePresence>
        {animateCollapseStageContainerWithDelay && (
          <motion.div
            {...createAnimationProps({
              customVariants: {
                animations: ['fadeIn-full'],
                hidden: {
                  opacity: 0
                },
                visible: {
                  opacity: 1,
                  transition: ANIMATION_TRANSITION
                }
              }
            })}
          >
            <Tooltip
              key="stage-control-tooltip-leave"
              position="above"
              translate={{ y: 2 }}
              message={
                !shouldDisableStageButtonWithDelay &&
                $stageContent.leave_session
              }
            >
              <Button
                ref={leaveStageButtonRef}
                ariaLabel={$stageContent.leave_session}
                key="create-stage-control-btn"
                variant="icon"
                isDisabled={shouldDisableStageButtonWithDelay}
                onClick={() =>
                  handleOnConfirmLeaveStage({
                    lastFocusedElementRef: leaveStageButtonRef
                  })
                }
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
      </AnimatePresence>
    </motion.div>
  );
};

export default StageControl;
