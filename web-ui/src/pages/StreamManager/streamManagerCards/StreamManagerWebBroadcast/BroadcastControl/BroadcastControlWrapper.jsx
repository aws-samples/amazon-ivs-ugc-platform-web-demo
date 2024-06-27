import { forwardRef, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';

import BroadcastControl from './BroadcastControl';
import {
  MicOff,
  MicOn,
  ScreenShare,
  ScreenShareOff,
  Settings,
  VideoCamera,
  VideoCameraOff
} from '../../../../../assets/icons';
import { useBroadcast } from '../../../../../contexts/Broadcast';
import { streamManager as $streamManagerContent } from '../../../../../content';
import { useResponsiveDevice } from '../../../../../contexts/ResponsiveDevice';
import { AUDIO_INPUT_NAME } from '../../../../../contexts/Broadcast/useAudioMixer';
import { VIDEO_LAYER_NAME } from '../../../../../contexts/Broadcast/useLayers';
import { MODAL_TYPE, useModal } from '../../../../../contexts/Modal';
import { useDeviceManager } from '../../../../../contexts/DeviceManager';
import {
  StageFactory,
  useStageManager
} from '../../../../../contexts/StageManager';

const $content = $streamManagerContent.stream_manager_web_broadcast;

const BroadcastControlWrapper = forwardRef(
  ({ isOpen, withSettingsButton, withScreenshareButton }, ref) => {
    const settingsButtonRef = useRef();
    const { isTouchscreenDevice } = useResponsiveDevice();
    const { openModal, closeModal } = useModal();
    const {
      toggleMicrophone: toggleBroadcastMicrophone,
      toggleCamera: toggleBroadcastCamera,
      toggleScreenShare,
      isMicrophoneMuted: isBroadcastMicrophoneMuted,
      isCameraHidden: isBroadcastCameraHidden,
      activeDevices: {
        [AUDIO_INPUT_NAME]: activeMicrophone,
        [VIDEO_LAYER_NAME]: activeCamera
      }
    } = useBroadcast();
    const {
      userMedia: { audioMuted, videoStopped },
      displayMedia: { isScreenSharing, startScreenShare, stopScreenShare }
    } = useDeviceManager();
    const {
      user: userStage = null,
      display: displayStage = null,
      stageControls,
      participantRole,
      isJoiningStageByRequestOrInvite
    } = useStageManager() || {};
    const isStageActive = userStage?.isUserStageConnected;
    const isStageSpectator = participantRole === 'spectator';

    const publishingUserParticipants =
      userStage?.getParticipants({
        isPublishing: true,
        canSubscribeTo: true
      }) || [];
    const publishingDisplayParticipants =
      displayStage?.getParticipants({
        isPublishing: true,
        canSubscribeTo: true
      }) || [];
    const shouldDisableScreenshareButton =
      (publishingDisplayParticipants.length >= 2 ||
        publishingUserParticipants.length >= 12) &&
      !isScreenSharing;

    const { shouldRenderShareScreenButton } = stageControls || {};

    const shouldRenderStageScreenShareButton =
      shouldRenderShareScreenButton && !isTouchscreenDevice;
    const shouldRenderBroadcastScreenShareButton =
      !isTouchscreenDevice && withScreenshareButton;

    const {
      toggleCamera,
      toggleMicrophone,
      isMicrophoneMuted,
      isCameraHidden
    } =
      isStageActive || isJoiningStageByRequestOrInvite
        ? {
            toggleMicrophone: stageControls.toggleAudio,
            isMicrophoneMuted: audioMuted,
            toggleCamera: stageControls.toggleVideo,
            isCameraHidden: videoStopped
          }
        : {
            toggleMicrophone: toggleBroadcastMicrophone,
            isMicrophoneMuted: isBroadcastMicrophoneMuted,
            toggleCamera: toggleBroadcastCamera,
            isCameraHidden: isBroadcastCameraHidden
          };

    const handleScreenShare = useCallback(() => {
      if (isScreenSharing) {
        stopScreenShare();
      } else if (StageFactory.hasPublishCapacity) {
        startScreenShare();
      }
    }, [isScreenSharing, startScreenShare, stopScreenShare]);

    const controllerButtonProps = useMemo(
      () => [
        {
          onClick: toggleMicrophone,
          ariaLabel: isMicrophoneMuted
            ? 'Turn on microphone'
            : 'Turn off microphone',
          isDeviceControl: true,
          isActive: !isMicrophoneMuted,
          isDisabled: !activeMicrophone || isStageSpectator,
          icon: isMicrophoneMuted ? <MicOff /> : <MicOn />,
          tooltip: isMicrophoneMuted ? $content.unmute : $content.mute
        },
        {
          onClick: toggleCamera,
          ariaLabel: isCameraHidden ? 'Turn on camera' : 'Turn off camera',
          isDeviceControl: true,
          isActive: !isCameraHidden,
          isDisabled: !activeCamera || isStageSpectator,
          icon: isCameraHidden ? <VideoCameraOff /> : <VideoCamera />,
          tooltip: isCameraHidden ? $content.show_camera : $content.hide_camera
        },
        {
          onClick: isStageActive ? handleScreenShare : toggleScreenShare,
          ariaLabel: isScreenSharing
            ? 'Start screen sharing'
            : 'Stop screen sharing',
          isVisible: isStageActive
            ? shouldRenderStageScreenShareButton
            : shouldRenderBroadcastScreenShareButton,
          isActive: isScreenSharing,
          isDisabled:
            isStageSpectator ||
            !activeCamera ||
            !activeMicrophone ||
            shouldDisableScreenshareButton,
          icon: isScreenSharing ? <ScreenShareOff /> : <ScreenShare />,
          tooltip: isScreenSharing
            ? $content.stop_sharing
            : $content.share_your_screen
        }
      ],
      [
        toggleMicrophone,
        isMicrophoneMuted,
        activeMicrophone,
        isStageSpectator,
        toggleCamera,
        isCameraHidden,
        activeCamera,
        isStageActive,
        handleScreenShare,
        toggleScreenShare,
        isScreenSharing,
        shouldRenderStageScreenShareButton,
        shouldRenderBroadcastScreenShareButton,
        shouldDisableScreenshareButton
      ]
    );

    const handleSettingsClick = () => {
      closeModal({ shouldCancel: false, shouldRefocus: false });
      openModal({
        type: MODAL_TYPE.STREAM_BROADCAST_SETTINGS,
        lastFocusedElement: settingsButtonRef
      });
    };

    const controllerButtonPropsWithSettingsButton = [
      ...controllerButtonProps,
      {
        onClick: handleSettingsClick,
        ariaLabel: 'Open video and audio settings modal',
        withRef: true,
        icon: <Settings />,
        tooltip: $content.open_settings,
        isDisabled: isStageSpectator
      }
    ];

    return (
      <div ref={ref}>
        <BroadcastControl
          ref={settingsButtonRef}
          isOpen={isOpen}
          buttons={
            withSettingsButton
              ? controllerButtonPropsWithSettingsButton
              : controllerButtonProps
          }
        />
      </div>
    );
  }
);

BroadcastControlWrapper.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  withScreenshareButton: PropTypes.bool.isRequired,
  withSettingsButton: PropTypes.bool.isRequired
};

export default BroadcastControlWrapper;
