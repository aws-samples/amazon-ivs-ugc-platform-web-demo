import { useRef } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

import { clsm } from '../../../../utils';
import { streamManager as $content } from '../../../../content';
import { useBroadcast } from '../../../../contexts/Broadcast';
import { MODAL_TYPE, useModal } from '../../../../contexts/Modal';
import { useStreams } from '../../../../contexts/Streams';
import Button from '../../../../components/Button';
import Spinner from '../../../../components/Spinner';
import Tooltip from '../../../../components/Tooltip';
import {
  useGlobalStage,
  useStreamManagerStage
} from '../../../../contexts/Stage';
import {
  ANIMATION_DURATION,
  useBroadcastFullScreen
} from '../../../../contexts/BroadcastFullscreen';
import { LeaveSession } from '../../../../assets/icons';
import { createAnimationProps } from '../../../../helpers/animationPropsHelper';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';

const $webBroadcastContent = $content.stream_manager_web_broadcast;
const $stageContent = $content.stream_manager_stage;
const {
  your_channel_is_already_live: YourChannelIsAlreadyLive,
  notifications: {
    error: { permissions_denied: PermissionDenied }
  }
} = $webBroadcastContent;

const GoLiveStreamButton = ({
  tooltipPosition,
  tooltipCustomTranslate = {},
  shouldShowTooltipMessage = true
}) => {
  const streamButtonRef = useRef();
  const {
    isBroadcasting,
    startBroadcast,
    stopBroadcast,
    isConnecting,
    hasPermissions
  } = useBroadcast();
  const {
    isStageActive,
    collaborateButtonAnimationControls,
    isHost,
    shouldDisableStageButtonWithDelay,
    isJoiningStageByRequestOrInvite,
    isCreatingStage
  } = useGlobalStage();

  const { handleOnConfirmLeaveStage, handleParticipantJoinStage } =
    useStreamManagerStage();
  const {
    setIsFullScreenViewOpen,
    isFullScreenViewOpen,
    initializeGoLiveContainerDimensions
  } = useBroadcastFullScreen();
  const { openModal, isModalOpen, type: modalType } = useModal();
  const { isLive } = useStreams();
  const { isDesktopView } = useResponsiveDevice();
  const shouldDisableLeaveStageButton =
    isStageActive && shouldDisableStageButtonWithDelay;
  const isDisabled =
    !hasPermissions ||
    shouldDisableLeaveStageButton ||
    (isLive && !isBroadcasting);

  const stageButtonContent = isHost
    ? $stageContent.end_session
    : $stageContent.leave_session;

  const handleStartStopBroadcastingAction = () => {
    if (isStageActive) {
      const closeFullscreenAndAnimateStreamButtonCallback = async () => {
        setIsFullScreenViewOpen(false);
        await collaborateButtonAnimationControls.start({
          zIndex: 1000,
          opacity: 1,
          transition: { duration: 0.45 }
        });
        collaborateButtonAnimationControls.start({ zIndex: 'unset' });
      };

      if (!isDesktopView) initializeGoLiveContainerDimensions();

      handleOnConfirmLeaveStage({
        ...(isFullScreenViewOpen && {
          closeFullscreenAndAnimateStreamButtonCallback
        }),
        lastFocusedElementRef: streamButtonRef
      });
    } else {
      if (isBroadcasting) {
        openModal({
          content: {
            confirmText: $webBroadcastContent.end_stream,
            message: $webBroadcastContent.confirm_end_stream,
            isDestructive: true
          },
          onConfirm: stopBroadcast,
          lastFocusedElement: streamButtonRef
        });
      } else startBroadcast();
    }
  };

  let tooltipMessage;
  if (shouldShowTooltipMessage) {
    if (
      isStageActive &&
      isFullScreenViewOpen &&
      !shouldDisableStageButtonWithDelay
    )
      tooltipMessage = stageButtonContent;
    if (isLive && !isBroadcasting) tooltipMessage = YourChannelIsAlreadyLive;
    else if (!hasPermissions) tooltipMessage = PermissionDenied;
  }

  let buttonTextContent;
  if (
    isConnecting ||
    (isCreatingStage && isModalOpen && modalType === MODAL_TYPE.STAGE_JOIN)
  ) {
    buttonTextContent = <Spinner />;
  } else if (isBroadcasting) {
    buttonTextContent = <p>{$webBroadcastContent.end_stream}</p>;
  } else if (isJoiningStageByRequestOrInvite) {
    buttonTextContent = <p>{$stageContent.join_now}</p>;
  } else {
    buttonTextContent = <p>{$webBroadcastContent.start_stream}</p>;
  }

  if (isStageActive && !isBroadcasting) {
    buttonTextContent = isFullScreenViewOpen ? (
      <motion.div
        {...createAnimationProps({
          customVariants: {
            hidden: {
              opacity: 0
            },
            visible: {
              opacity: 1,
              transition: {
                opacity: { delay: ANIMATION_DURATION }
              }
            }
          },
          options: {
            isVisible: isFullScreenViewOpen,
            shouldAnimateIn: !isJoiningStageByRequestOrInvite
          }
        })}
        className={clsm([
          '[&>svg]:h-6',
          '[&>svg]:w-6',
          '[&>svg]:fill-white',
          'dark:[&>svg]:fill-black'
        ])}
      >
        <LeaveSession />
      </motion.div>
    ) : (
      stageButtonContent
    );
  }

  return (
    <Tooltip
      position={tooltipPosition}
      translate={tooltipCustomTranslate}
      message={tooltipMessage}
    >
      <Button
        ref={streamButtonRef}
        onClick={
          isJoiningStageByRequestOrInvite
            ? handleParticipantJoinStage
            : handleStartStopBroadcastingAction
        }
        variant="primary"
        isDisabled={isDisabled}
        className={clsm([
          isStageActive && isFullScreenViewOpen && ['px-[10px]', 'min-w-fit'],
          'w-full',
          'h-11',
          'dark:[&>svg]:fill-black',
          'relative',
          '[&>svg]:h-6',
          '[&>svg]:w-6',
          'space-x-1',
          'rounded-3xl',
          (isBroadcasting || isStageActive) && [
            'dark:bg-darkMode-red',
            'bg-lightMode-red',
            'hover:dark:bg-darkMode-red-hover',
            'hover:bg-lightMode-red-hover',
            'focus:bg-lightMode-red',
            'dark:focus:bg-darkMode-red',
            'dark:text-black',
            'text-white'
          ]
        ])}
      >
        {buttonTextContent}
      </Button>
    </Tooltip>
  );
};

GoLiveStreamButton.propTypes = {
  tooltipPosition: PropTypes.oneOf(['above', 'below', 'right', 'left'])
    .isRequired,
  tooltipCustomTranslate: PropTypes.object,
  shouldShowTooltipMessage: PropTypes.bool
};

export default GoLiveStreamButton;
