import { useCallback, useEffect } from 'react';

import { BREAKPOINTS } from '../../../constants';
import { CAMERA_LAYER_NAME } from '../../Broadcast/useLayers';
import { LOCAL_KEY } from '../Global/reducer/globalReducer';
import { MICROPHONE_AUDIO_INPUT_NAME } from '../../Broadcast/useAudioMixer';
import { noop } from '../../../utils';
import { streamManager as $streamManagerContent } from '../../../content';
import { useModal } from '../../Modal';
import { useResponsiveDevice } from '../../ResponsiveDevice';
import usePrevious from '../../../hooks/usePrevious';
import usePrompt from '../../../hooks/usePrompt';
import useThrottledCallback from '../../../hooks/useThrottledCallback';

const $contentStageConfirmationModal =
  $streamManagerContent.stream_manager_stage.leave_stage_modal;

const useStageControls = ({
  isStageActive,
  leaveStage,
  localParticipant,
  isBlockingRoute,
  resetStage,
  strategy,
  toggleCameraState,
  toggleMicrophoneState,
  activeCameraDevice,
  activeMicrophoneDevice,
  devices
}) => {
  const { openModal, closeModal } = useModal();
  const { isBlocked, onCancel, onConfirm } = usePrompt(isBlockingRoute, false);
  const cameraDevices = devices?.[CAMERA_LAYER_NAME];
  const microphoneDevices = devices?.[MICROPHONE_AUDIO_INPUT_NAME];
  const prevCameraDevices = usePrevious(cameraDevices);
  const prevMicrophoneDevices = usePrevious(microphoneDevices);
  const prevActiveCameraDevice = usePrevious(activeCameraDevice);
  const prevActiveMicrophoneDevice = usePrevious(activeMicrophoneDevice);
  const { currentBreakpoint } = useResponsiveDevice();
  const isMobile = currentBreakpoint < BREAKPOINTS.sm;
  const isStageHost = localParticipant?.attributes?.type === 'host';

  const toggleCamera = useThrottledCallback(() => {
    toggleCameraState(LOCAL_KEY);
  }, 250);

  const toggleMicrophone = useThrottledCallback(() => {
    toggleMicrophoneState(LOCAL_KEY);
  }, 250);

  const handleOnConfirmLeaveStage = useCallback(
    ({
      closeFullscreenAndAnimateCollaborateButtonCallback = undefined,
      lastFocusedElementRef = {}
    } = {}) => {
      const message = isStageHost
        ? $contentStageConfirmationModal.exit_stage_session_host
        : $contentStageConfirmationModal.exit_stage_session;

      openModal({
        content: {
          confirmText: $contentStageConfirmationModal.confirm_exit,
          isDestructive: true,
          message
        },
        onConfirm: () => {
          if (
            typeof closeFullscreenAndAnimateCollaborateButtonCallback ===
            'function'
          ) {
            closeFullscreenAndAnimateCollaborateButtonCallback();
          }
          leaveStage();
        },
        onCancel: closeModal,
        lastFocusedElement: lastFocusedElementRef
      });
    },
    [closeModal, isStageHost, leaveStage, openModal]
  );

  useEffect(() => {
    if (!strategy.videoTrack) return;

    const { setMuted: setIsCameraHidden = noop } = strategy.videoTrack;
    const delayedSetIsCameraHidden = setTimeout(() => {
      setIsCameraHidden(localParticipant?.isCameraHidden);
    }, 250);

    return () => clearTimeout(delayedSetIsCameraHidden);
  }, [strategy.videoTrack, localParticipant?.isCameraHidden]);

  useEffect(() => {
    if (!strategy.audioTrack) return;

    const { setMuted = noop } = strategy.audioTrack;
    const delayedSetMuted = setTimeout(() => {
      setMuted(localParticipant?.isMicrophoneMuted);
    }, 250);

    return () => clearTimeout(delayedSetMuted);
  }, [strategy.audioTrack, localParticipant?.isMicrophoneMuted]);

  useEffect(() => {
    if (isBlocked && isStageActive) {
      openModal({
        content: {
          confirmText: $contentStageConfirmationModal.leave_page,
          isDestructive: true,
          message: (
            <p>
              {$contentStageConfirmationModal.confirm_leave_page_L1}
              {isMobile ? ' ' : <br />}
              {$contentStageConfirmationModal.confirm_leave_page_L2}
            </p>
          )
        },
        onConfirm: () => {
          resetStage();
          onConfirm();
        },
        onCancel
      });
    }
  }, [
    isBlocked,
    isMobile,
    isStageActive,
    onCancel,
    onConfirm,
    openModal,
    resetStage
  ]);

  useEffect(() => {
    if (!isStageActive || !activeCameraDevice) return;

    const isCameraDeviceDisconnected =
      !!prevActiveCameraDevice &&
      prevActiveCameraDevice.deviceId !== activeCameraDevice.deviceId &&
      cameraDevices?.length !== prevCameraDevices?.length;

    if (isCameraDeviceDisconnected) toggleCameraState(LOCAL_KEY, true);
  }, [
    activeCameraDevice,
    cameraDevices,
    isStageActive,
    prevActiveCameraDevice,
    prevCameraDevices,
    toggleCameraState
  ]);

  useEffect(() => {
    if (!isStageActive || !activeMicrophoneDevice) return;

    const isMicrophoneDeviceDisconnected =
      prevActiveMicrophoneDevice?.deviceId !==
        activeMicrophoneDevice?.deviceId &&
      microphoneDevices?.length !== prevMicrophoneDevices?.length;

    if (isMicrophoneDeviceDisconnected) toggleMicrophoneState(LOCAL_KEY, true);
  }, [
    activeMicrophoneDevice,
    isStageActive,
    microphoneDevices,
    prevActiveMicrophoneDevice,
    prevMicrophoneDevices,
    toggleMicrophoneState
  ]);

  return { toggleCamera, toggleMicrophone, handleOnConfirmLeaveStage };
};

export default useStageControls;
