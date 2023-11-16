import { useMemo, useRef } from 'react';
import PropTypes from 'prop-types';

import BroadcastControl from './BroadcastControl';
import { useStreamManagerStage } from '../../../../../contexts/Stage';
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
import { MICROPHONE_AUDIO_INPUT_NAME } from '../../../../../contexts/Broadcast/useAudioMixer';
import { CAMERA_LAYER_NAME } from '../../../../../contexts/Broadcast/useLayers';
import { MODAL_TYPE, useModal } from '../../../../../contexts/Modal';
import { useBroadcastFullScreen } from '../../../../../contexts/BroadcastFullscreen';
import { useGlobalStage } from '../../../../../contexts/Stage';

const $content = $streamManagerContent.stream_manager_web_broadcast;

const BroadcastControlWrapper = ({
  isOpen,
  withSettingsButton,
  withScreenshareButton
}) => {
  const {
    isStageActive,
    isJoiningStageByRequestOrInvite,
    updateShouldOpenSettingsModal
  } = useGlobalStage();
  const settingsButtonRef = useRef();
  const { isTouchscreenDevice, isDesktopView, isMobileView } =
    useResponsiveDevice();
  const { openModal, closeModal } = useModal();
  const {
    toggleMicrophone: toggleStageMicrophone,
    toggleCamera: toggleStageCamera,
    stageControlsVisibility
  } = useStreamManagerStage();
  const {
    localParticipant,
    isSpectator: isStageSpectator,
    animateCollapseStageContainerWithDelay
  } = useGlobalStage();
  const {
    isMicrophoneMuted: isStageMicrophoneMuted,
    isCameraHidden: isStageCameraHidden
  } = localParticipant || {};
  const { isFullScreenViewOpen } = useBroadcastFullScreen();
  const {
    toggleMicrophone: toggleBroadcastMicrophone,
    toggleCamera: toggleBroadcastCamera,
    toggleScreenShare,
    isScreenSharing,
    isMicrophoneMuted: isBroadcastMicrophoneMuted,
    isCameraHidden: isBroadcastCameraHidden,
    activeDevices: {
      [MICROPHONE_AUDIO_INPUT_NAME]: activeMicrophone,
      [CAMERA_LAYER_NAME]: activeCamera
    }
  } = useBroadcast();

  const { shouldRenderShareScreenButton } = stageControlsVisibility;

  const shouldRenderStageScreenShareButton =
    isStageActive &&
    shouldRenderShareScreenButton &&
    !isTouchscreenDevice &&
    isDesktopView;
  const shouldRenderBroadcastScreenShareButton =
    !isTouchscreenDevice && withScreenshareButton;

  const { toggleMicrophone, isMicrophoneMuted, toggleCamera, isCameraHidden } =
    isStageActive
      ? {
          toggleMicrophone: toggleStageMicrophone,
          isMicrophoneMuted: isStageMicrophoneMuted,
          toggleCamera: toggleStageCamera,
          isCameraHidden: isStageCameraHidden
        }
      : {
          toggleMicrophone: toggleBroadcastMicrophone,
          isMicrophoneMuted: isBroadcastMicrophoneMuted,
          toggleCamera: toggleBroadcastCamera,
          isCameraHidden: isBroadcastCameraHidden
        };

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
        onClick: toggleScreenShare,
        ariaLabel: isScreenSharing
          ? 'Start screen sharing'
          : 'Stop screen sharing',
        isVisible: isStageActive
          ? shouldRenderStageScreenShareButton
          : shouldRenderBroadcastScreenShareButton,
        isActive: isScreenSharing,
        isDisabled:
          isStageSpectator ||
          (isFullScreenViewOpen && isStageActive) ||
          animateCollapseStageContainerWithDelay ||
          !activeCamera ||
          !activeMicrophone,
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
      toggleScreenShare,
      isScreenSharing,
      isStageActive,
      shouldRenderStageScreenShareButton,
      shouldRenderBroadcastScreenShareButton,
      isFullScreenViewOpen,
      animateCollapseStageContainerWithDelay
    ]
  );

  const handleSettingsClick = () => {
    if (isJoiningStageByRequestOrInvite && !isMobileView) {
      closeModal();
      updateShouldOpenSettingsModal(true);
    } else {
      openModal({
        type: MODAL_TYPE.STREAM_BROADCAST_SETTINGS,
        lastFocusedElement: settingsButtonRef
      });
    }
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
    <>
      <BroadcastControl
        ref={settingsButtonRef}
        isOpen={isOpen}
        buttons={
          withSettingsButton
            ? controllerButtonPropsWithSettingsButton
            : controllerButtonProps
        }
      />
    </>
  );
};

BroadcastControlWrapper.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  withScreenshareButton: PropTypes.bool.isRequired,
  withSettingsButton: PropTypes.bool.isRequired
};

export default BroadcastControlWrapper;
