import { forwardRef, useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import { PARTICIPANT_TYPES } from '../../../../../constants';
import { updateDisplayMediaStates } from '../../../../../reducers/streamManager';
import { PARTICIPANT_GROUP } from '../../../../../contexts/StageManager/constants';

const $content = $streamManagerContent.stream_manager_web_broadcast;

const BroadcastControlWrapper = forwardRef(
  ({ isOpen, withSettingsButton, withScreenshareButton }, ref) => {
    const dispatch = useDispatch();
    const { collaborate } = useSelector((state) => state.shared);
    const {
      displayMedia: { isScreenSharing }
    } = useSelector((state) => state.streamManager);
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
      userMedia: { audioMuted, videoStopped }
    } = useDeviceManager();
    const {
      [PARTICIPANT_GROUP.USER]: userStage = null,
      [PARTICIPANT_GROUP.DISPLAY]: displayStage = null,
      stageControls
    } = useStageManager() || {};
    const isStageActive = userStage?.isConnected;
    const isStageSpectator =
      collaborate.participantType === PARTICIPANT_TYPES.SPECTATOR;

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
      isStageActive || collaborate.isJoining
        ? {
            toggleMicrophone: stageControls?.toggleAudio,
            isMicrophoneMuted: audioMuted,
            toggleCamera: stageControls?.toggleVideo,
            isCameraHidden: videoStopped
          }
        : {
            toggleMicrophone: toggleBroadcastMicrophone,
            isMicrophoneMuted: isBroadcastMicrophoneMuted,
            toggleCamera: toggleBroadcastCamera,
            isCameraHidden: isBroadcastCameraHidden
          };

    /**
     * Changes to "isScreenSharing" Redux state trigger startScreenShare or stopScreenShare
     * in DeviceManager context via useEffect.
     */
    const handleScreenShare = useCallback(() => {
      if (isScreenSharing) {
        dispatch(updateDisplayMediaStates({ isScreenSharing: false }));
      } else if (StageFactory.hasPublishCapacity) {
        dispatch(updateDisplayMediaStates({ isScreenSharing: true }));
      }
    }, [dispatch, isScreenSharing]);

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

    const openStageJoinModal = useCallback(() => {
      closeModal({ shouldCancel: false, shouldRefocus: false });
      openModal({
        type: MODAL_TYPE.STAGE_JOIN
      });
    }, [closeModal, openModal]);

    const handleSettingsClick = () => {
      let modalData = {};

      // Update modal functions for the join stage session flow
      if (collaborate.isJoining) {
        modalData = {
          onCancel: () => {
            openStageJoinModal();
          },
          onConfirm: () => {
            openStageJoinModal();

            return false; // should not close modal
          }
        };
      }
      closeModal({ shouldCancel: false, shouldRefocus: false });
      openModal({
        type: MODAL_TYPE.STREAM_BROADCAST_SETTINGS,
        lastFocusedElement: settingsButtonRef,
        ...modalData
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
