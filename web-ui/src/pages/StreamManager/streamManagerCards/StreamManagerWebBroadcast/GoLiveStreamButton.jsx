import { useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import { clsm } from '../../../../utils';
import { streamManager as $content } from '../../../../content';
import { useBroadcast } from '../../../../contexts/Broadcast';
import { MODAL_TYPE, useModal } from '../../../../contexts/Modal';
import { useStreams } from '../../../../contexts/Streams';
import Button from '../../../../components/Button';
import Spinner from '../../../../components/Spinner';
import Tooltip from '../../../../components/Tooltip';
import { LeaveSession } from '../../../../assets/icons';
import { createAnimationProps } from '../../../../helpers/animationPropsHelper';
import { useStageManager } from '../../../../contexts/StageManager';
import {
  FULLSCREEN_ANIMATION_DURATION,
  PARTICIPANT_TYPES
} from '../../../../constants';
import { GO_LIVE_BUTTON_CLASSES } from './styleClasses';
import { useChat } from '../../../../contexts/Chat';

const $webBroadcastContent = $content.stream_manager_web_broadcast;
const $stageContent = $content.stream_manager_stage;
const $contentStageConfirmationModal =
  $content.stream_manager_stage.leave_stage_modal;

const {
  your_channel_is_already_live: YourChannelIsAlreadyLive,
  notifications: {
    error: { permissions_denied: PermissionDenied }
  }
} = $webBroadcastContent;

const GoLiveStreamButton = ({
  tooltipPosition,
  tooltipCustomTranslate = {},
  shouldShowTooltipMessage = true,
  onClick = null
}) => {
  const {
    fullscreen: { isOpen: isFullscreenOpen }
  } = useSelector((state) => state.streamManager);
  const { collaborate } = useSelector((state) => state.shared);
  const streamButtonRef = useRef();
  const { saveTempChatMessages } = useChat();
  const {
    isBroadcasting,
    startBroadcast,
    stopBroadcast,
    isConnecting,
    hasPermissions
  } = useBroadcast();
  const { user: userStage = null, stageControls = null } =
    useStageManager() || {};
  const { leaveStage } = stageControls || {};
  const isStageActive = userStage?.isConnected;
  const isHost = collaborate.participantType === PARTICIPANT_TYPES.HOST;
  const isUserStageConnecting = userStage?.connectState === 'connecting';

  const { openModal, isModalOpen, type: modalType } = useModal();
  const { isLive } = useStreams();
  const isStageJoinModalOpen =
    isModalOpen && modalType === MODAL_TYPE.STAGE_JOIN;
  const isDisabled = !hasPermissions || (isLive && !isBroadcasting);

  const openLeaveStageConfirmModal = useCallback(
    ({ lastFocusedElementRef = {} } = {}) => {
      const message = isHost
        ? $contentStageConfirmationModal.exit_stage_session_host
        : $contentStageConfirmationModal.exit_stage_session;

      openModal({
        content: {
          confirmText: $contentStageConfirmationModal.confirm_exit,
          isDestructive: true,
          message
        },
        onConfirm: async () => {
          saveTempChatMessages();
          await leaveStage();
        },
        lastFocusedElement: lastFocusedElementRef
      });
    },
    [isHost, leaveStage, openModal, saveTempChatMessages]
  );

  const openStopBroadcastConfirmModal = useCallback(() => {
    openModal({
      content: {
        confirmText: $webBroadcastContent.end_stream,
        message: $webBroadcastContent.confirm_end_stream,
        isDestructive: true
      },
      onConfirm: stopBroadcast,
      lastFocusedElement: streamButtonRef
    });
  }, [openModal, stopBroadcast]);

  const handleStartStopBroadcastingAction = () => {
    if (isStageActive) {
      openLeaveStageConfirmModal({
        lastFocusedElementRef: streamButtonRef
      });
    } else {
      if (isBroadcasting) {
        openStopBroadcastConfirmModal();
      } else {
        startBroadcast();
      }
    }
  };

  /**
   * Content
   */
  const stageButtonContent = useMemo(
    () => (isHost ? $stageContent.end_session : $stageContent.leave_session),
    [isHost]
  );

  const tooltipMessage = useMemo(() => {
    let message;
    if (shouldShowTooltipMessage) {
      if (isStageActive && isFullscreenOpen) {
        message = stageButtonContent;
      } else if (isLive && !isBroadcasting) {
        message = YourChannelIsAlreadyLive;
      } else if (!hasPermissions) {
        message = PermissionDenied;
      }
    }

    return message;
  }, [
    hasPermissions,
    isBroadcasting,
    isFullscreenOpen,
    isLive,
    isStageActive,
    shouldShowTooltipMessage,
    stageButtonContent
  ]);

  const buttonTextContent = useMemo(() => {
    let content;
    if (isConnecting || (isUserStageConnecting && isStageJoinModalOpen)) {
      content = <Spinner />;
    } else if (isBroadcasting) {
      content = <p>{$webBroadcastContent.end_stream}</p>;
    } else if (collaborate.isJoining) {
      content = <p>{$stageContent.join_now}</p>;
    } else if (isStageActive && !isBroadcasting) {
      content = isFullscreenOpen ? (
        <motion.div
          {...createAnimationProps({
            customVariants: {
              hidden: {
                opacity: 0
              },
              visible: {
                opacity: 1,
                transition: {
                  opacity: { delay: FULLSCREEN_ANIMATION_DURATION }
                }
              }
            },
            options: {
              isVisible: isFullscreenOpen,
              shouldAnimateIn: !collaborate.isJoining
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
    } else {
      content = <p>{$webBroadcastContent.start_stream}</p>;
    }

    return content;
  }, [
    collaborate.isJoining,
    isBroadcasting,
    isConnecting,
    isFullscreenOpen,
    isStageActive,
    isStageJoinModalOpen,
    isUserStageConnecting,
    stageButtonContent
  ]);

  return (
    <Tooltip
      position={tooltipPosition}
      translate={tooltipCustomTranslate}
      message={tooltipMessage}
    >
      <Button
        ref={streamButtonRef}
        onClick={onClick ?? handleStartStopBroadcastingAction}
        variant="primary"
        isDisabled={isDisabled}
        className={clsm([
          isStageActive && isFullscreenOpen && ['px-[10px]', 'min-w-fit'],
          'w-full',
          GO_LIVE_BUTTON_CLASSES,
          (isBroadcasting || (isStageActive && !collaborate.isJoining)) && [
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
  shouldShowTooltipMessage: PropTypes.bool,
  onClick: PropTypes.func
};

export default GoLiveStreamButton;
