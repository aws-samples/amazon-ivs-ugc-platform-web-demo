import { useRef } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

import { clsm } from '../../../../utils';
import { streamManager as $content } from '../../../../content';
import { useBroadcast } from '../../../../contexts/Broadcast';
import { useModal } from '../../../../contexts/Modal';
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
import { useLocation } from 'react-router-dom';
import { useChannel } from '../../../../contexts/Channel';
import useRequestParticipants from '../../hooks/useRequestParticipants';

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
  tooltipCustomTranslate,
  shouldShowTooltipMessage
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
    stageId,
    isJoiningStageByRequest,
    isJoiningStageByInvite
  } = useGlobalStage();
  const { state } = useLocation();
  const isJoiningStageByModal = isJoiningStageByInvite || isJoiningStageByRequest
  const { handleOnConfirmLeaveStage, handleParticipantInvite } =
    useStreamManagerStage();
  const { setIsFullScreenViewOpen, isFullScreenViewOpen } =
    useBroadcastFullScreen();
  const { joinStageByRequest } = useRequestParticipants();
  const { openModal } = useModal();
  const { channelData } = useChannel();
  const { isLive } = useStreams();
  const isStageActiveInAnotherTab = !isStageActive && stageId;
  const shouldDisableLeaveStageButton =
    isStageActive && shouldDisableStageButtonWithDelay;
  const isDisabled =
    !hasPermissions ||
    isStageActiveInAnotherTab ||
    shouldDisableLeaveStageButton ||
    (isLive && !isBroadcasting)
    || (isJoiningStageByModal && !!channelData?.stageId)

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
    if (((isLive && !isBroadcasting) || (isJoiningStageByModal && !!channelData?.stageId))) tooltipMessage = YourChannelIsAlreadyLive;
    else if (!hasPermissions) tooltipMessage = PermissionDenied;
  }

  let buttonTextContent;
  if (isConnecting) {
    buttonTextContent = <Spinner />;
  } else if (isBroadcasting) {
    buttonTextContent = <p>{$webBroadcastContent.end_stream}</p>;
  } else if (state?.isJoiningStageByRequest) {
    buttonTextContent = <p>Join now</p>;
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
            isVisible: isFullScreenViewOpen
          }
        })}
        className={clsm(['[&>svg]:h-6', '[&>svg]:w-6'])}
      >
        <LeaveSession />
      </motion.div>
    ) : (
      stageButtonContent
    );
  }

  const joinStage = () => {
    if (isJoiningStageByInvite) {
      const { avatar, color, username, channelAssetUrls } = channelData;
      const profileData = {
        avatar,
        profileColor: color,
        username,
        channelAssetUrls
      };
      handleParticipantInvite({
        isLive,
        isBroadcasting,
        profileData
      });
    }

    if (isJoiningStageByRequest) {
      joinStageByRequest();
    }
  };
  return (
    <Tooltip
      position={tooltipPosition}
      translate={tooltipCustomTranslate}
      message={tooltipMessage}
    >
      <Button
        ref={streamButtonRef}
        onClick={
          isJoiningStageByInvite || isJoiningStageByRequest
            ? joinStage
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
            'dark:focus:bg-darkMode-red'
          ]
        ])}
      >
        {buttonTextContent}
      </Button>
    </Tooltip>
  );
};

GoLiveStreamButton.defaultProps = {
  tooltipCustomTranslate: {},
  shouldShowTooltipMessage: true
};

GoLiveStreamButton.propTypes = {
  tooltipPosition: PropTypes.oneOf(['above', 'below', 'right', 'left'])
    .isRequired,
  tooltipCustomTranslate: PropTypes.object,
  shouldShowTooltipMessage: PropTypes.bool
};

export default GoLiveStreamButton;
