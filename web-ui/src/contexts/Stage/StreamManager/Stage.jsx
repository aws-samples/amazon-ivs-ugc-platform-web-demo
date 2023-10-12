import { createContext, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import copyToClipboard from 'copy-to-clipboard';
import PropTypes from 'prop-types';

import { CAMERA_LAYER_NAME } from '../../Broadcast/useLayers';
import {
  createJoinParticipantLink,
  JOIN_PARTICIPANT_URL_PARAM_KEY
} from '../../../helpers/stagesHelpers';
import {
  defaultParticipant,
  LOCAL_KEY,
  STATE_KEYS
} from '../Global/reducer/globalReducer';
import { decodeJWT } from '../../../utils';
import { ENABLE_LEAVE_SESSION_BUTTON_DELAY } from '../Global/Global';
import { MICROPHONE_AUDIO_INPUT_NAME } from '../../Broadcast/useAudioMixer';
import { stagesAPI } from '../../../api';
import { streamManager as $streamManagerContent } from '../../../content';
import { useBroadcast } from '../../Broadcast';
import { useGlobalStage } from '../../Stage';
import { useNotif } from '../../Notification';
import { useStreams } from '../../Streams';
import useContextHook from '../../useContextHook';
import useForceLoader from '../../../hooks/useForceLoader';
import useInviteParticipants from '../../../pages/StreamManager/hooks/useInviteParticipants';
import useStageClient from '../../../pages/StreamManager/hooks/useStageClient';
import useStageControls from './useStageControls';
import useStageStrategy from '../../../pages/StreamManager/hooks/useStageStrategy';

const $contentNotification =
  $streamManagerContent.stream_manager_stage.notifications;

const Context = createContext(null);
Context.displayName = 'Stage';

export const Provider = ({ children, previewRef: broadcastPreviewRef }) => {
  const {
    participants,
    addParticipant,
    updateParticipant,
    toggleCameraState,
    toggleMicrophoneState,
    isStageActive,
    stageId,
    updateStageId,
    updateAnimateCollapseStageContainerWithDelay,
    updateShouldAnimateGoLiveButtonChevronIcon,
    creatingStage,
    updateShouldDisableStageButtonWithDelay,
    strategy,
    updateError,
    updateSuccess,
    updateIsBlockingRoute,
    localParticipant,
    error,
    success,
    isBlockingRoute,
    isSpectator,
    shouldDisableStageButtonWithDelay,
    isCreatingStage
  } = useGlobalStage();
  const [searchParams] = useSearchParams();
  const stageIdUrlParam = searchParams.get(JOIN_PARTICIPANT_URL_PARAM_KEY);
  const {
    removeBroadcastClient,
    restartBroadcastClient,
    isBroadcasting,
    // Devices
    isCameraHidden: isBroadcastCameraHidden,
    isMicrophoneMuted: isBroadcastMicrophoneMuted,
    activeDevices,
    devices,
    initializeDevices,
    hasPermissions
  } = useBroadcast();
  const { notifyError, notifySuccess } = useNotif();
  const { isLive } = useStreams();
  const isLoadingForced = useForceLoader();
  const navigate = useNavigate();

  const isDevicesInitializedRef = useRef(false);
  const joinParticipantLinkRef = useRef();
  const broadcastDevicesStateObjRef = useRef(null);
  const shouldGetParticipantTokenRef = useRef(false);

  const shouldDisableCollaborateButton = isLive || isBroadcasting;
  const shouldDisableCopyLinkButton = isStageActive && isSpectator;

  const activeCameraDevice = activeDevices?.[CAMERA_LAYER_NAME];
  const activeMicrophoneDevice = activeDevices?.[MICROPHONE_AUDIO_INPUT_NAME];

  const { joinStageClient, resetAllStageState, leaveStageClient, client } =
    useStageClient({ updateSuccess, updateError, isDevicesInitializedRef });

  const { updateLocalStrategy } = useStageStrategy({
    client,
    isDevicesInitializedRef: isDevicesInitializedRef.current,
    updateError
  });

  const createStageInstanceAndJoin = useCallback(
    async (token, stageId) => {
      // Get and set local participant
      const localParticipantData = decodeJWT(token) || {};
      const { attributes, user_id: userId } = localParticipantData;

      const localParticipantObject = {
        attributes: {
          ...attributes,
          channelAssetsAvatarUrl: !!attributes.channelAssetsAvatarUrlPath
            ? `https://${attributes.channelAssetsAvatarUrlPath}`
            : ''
        },
        userId,
        isLocal: true,
        isCameraHidden:
          isBroadcastCameraHidden || defaultParticipant.isCameraHidden,
        isMicrophoneMuted:
          isBroadcastMicrophoneMuted || defaultParticipant.isMicrophoneMuted
      };
      if (localParticipant) {
        // update local participant
        updateParticipant(LOCAL_KEY, localParticipantObject);
      } else {
        addParticipant(localParticipantObject);
      }
      // From this point, changing routes will prompt confirmation modal
      updateIsBlockingRoute(true);

      updateStageId(stageId);
      joinParticipantLinkRef.current = createJoinParticipantLink(stageId);

      await joinStageClient({ token, strategy });
      await updateLocalStrategy();
    },
    [
      addParticipant,
      isBroadcastCameraHidden,
      isBroadcastMicrophoneMuted,
      joinParticipantLinkRef,
      joinStageClient,
      localParticipant,
      strategy,
      updateLocalStrategy,
      updateIsBlockingRoute,
      updateParticipant,
      updateStageId
    ]
  );

  const initializeStageClient = useCallback(
    async (openFullscreenViewCallbackFunction = undefined) => {
      if (stageId) return;

      creatingStage(true);

      const { result, error } = await stagesAPI.createStage();
      creatingStage(false);

      if (result) {
        // remove broadcast client
        removeBroadcastClient();

        updateShouldDisableStageButtonWithDelay(true);
        const { token, stageId } = result;
        await createStageInstanceAndJoin(token, stageId);

        // open fullscreen view
        openFullscreenViewCallbackFunction &&
          openFullscreenViewCallbackFunction();
      }

      if (error) {
        updateError({
          message: $contentNotification.error.unable_to_create_session,
          err: error
        });
      }
    },
    [
      removeBroadcastClient,
      stageId,
      creatingStage,
      createStageInstanceAndJoin,
      updateError,
      updateShouldDisableStageButtonWithDelay
    ]
  );

  const resetStage = useCallback(
    (showSuccess = false) => {
      // Stop all tracks
      if (localParticipant?.streams)
        localParticipant?.streams[0].mediaStreamTrack.stop();

      leaveStageClient();

      if (showSuccess) {
        updateSuccess($contentNotification.success.you_have_left_the_session);
        resetAllStageState({ omit: [STATE_KEYS.SUCCESS] });
      } else {
        resetAllStageState();
      }
      joinParticipantLinkRef.current = undefined;
      isDevicesInitializedRef.current = false;
      broadcastDevicesStateObjRef.current = null;
      shouldGetParticipantTokenRef.current = false;
    },
    [
      broadcastDevicesStateObjRef,
      isDevicesInitializedRef,
      joinParticipantLinkRef,
      leaveStageClient,
      localParticipant?.streams,
      resetAllStageState,
      shouldGetParticipantTokenRef,
      updateSuccess
    ]
  );

  const { handleParticipantInvite } = useInviteParticipants({
    shouldGetParticipantTokenRef,
    createStageInstanceAndJoin,
    updateError,
    resetStage,
    broadcastDevicesStateObjRef
  });

  const handleCopyJoinParticipantLinkAndNotify = useCallback(() => {
    copyToClipboard(joinParticipantLinkRef.current);
    updateSuccess(
      $contentNotification.success.session_link_has_been_copied_to_clipboard
    );
  }, [joinParticipantLinkRef, updateSuccess]);

  const leaveStage = useCallback(() => {
    // Disable usePrompt
    updateIsBlockingRoute(false);

    // Animate stage control buttons
    updateAnimateCollapseStageContainerWithDelay(false);
    updateShouldAnimateGoLiveButtonChevronIcon(false);

    setTimeout(() => {
      resetStage(true);
      if (stageIdUrlParam) navigate('/manager');
      broadcastDevicesStateObjRef.current = {
        isCameraHidden: localParticipant?.isCameraHidden || false,
        isMicrophoneMuted: localParticipant?.isMicrophoneMuted || false
      };
    }, 350);
  }, [
    updateIsBlockingRoute,
    updateAnimateCollapseStageContainerWithDelay,
    updateShouldAnimateGoLiveButtonChevronIcon,
    resetStage,
    stageIdUrlParam,
    navigate,
    localParticipant?.isCameraHidden,
    localParticipant?.isMicrophoneMuted,
    broadcastDevicesStateObjRef
  ]);

  const { toggleCamera, toggleMicrophone, handleOnConfirmLeaveStage } =
    useStageControls({
      localParticipant,
      resetStage,
      strategy,
      toggleCameraState,
      toggleMicrophoneState,
      leaveStage,
      isStageActive,
      isBlockingRoute,
      activeCameraDevice,
      activeMicrophoneDevice,
      devices
    });

  // Disabling the "Leave Stage" button for 7 seconds to ensure users do not encounter a 405 error when exiting the stage prematurely.
  useEffect(() => {
    if (!isStageActive || !shouldDisableStageButtonWithDelay) return;
    const timerId = setTimeout(
      () => updateShouldDisableStageButtonWithDelay(false),
      ENABLE_LEAVE_SESSION_BUTTON_DELAY
    );
    return () => {
      clearTimeout(timerId);
    };
  }, [
    isStageActive,
    updateShouldDisableStageButtonWithDelay,
    shouldDisableStageButtonWithDelay
  ]);

  useEffect(() => {
    // Initialize Web Broadcast client once stage has been left
    if (
      !!broadcastDevicesStateObjRef.current &&
      !isStageActive &&
      broadcastPreviewRef?.current
    ) {
      restartBroadcastClient(
        broadcastDevicesStateObjRef.current.isCameraHidden,
        broadcastDevicesStateObjRef.current.isMicrophoneMuted
      );
      broadcastDevicesStateObjRef.current = null;
    }
  }, [
    broadcastPreviewRef,
    restartBroadcastClient,
    isStageActive,
    broadcastDevicesStateObjRef
  ]);

  useEffect(() => {
    if (!isStageActive || isDevicesInitializedRef.current) return;

    const cameraDevices = devices?.[CAMERA_LAYER_NAME] || [];
    const microphoneDevices = devices?.[MICROPHONE_AUDIO_INPUT_NAME] || [];

    if (!!cameraDevices.length && !!microphoneDevices.length) {
      isDevicesInitializedRef.current = true;
    } else {
      (async function () {
        await initializeDevices();
        isDevicesInitializedRef.current = true;
      })();
    }
  }, [initializeDevices, isStageActive, devices, isDevicesInitializedRef]);

  useEffect(() => {
    if (error) {
      const { message, err } = error;

      if (err) console.error(...[err, message].filter((data) => !!data));

      if (message) notifyError(message, { asPortal: true });

      updateError(null);
    }
  }, [error, notifyError, updateError]);

  useEffect(() => {
    if (success) {
      notifySuccess(success, { asPortal: true });

      updateSuccess(null);
    }
  }, [success, notifySuccess, updateSuccess]);

  const value = useMemo(
    () => ({
      initializeStageClient,
      handleParticipantInvite,
      isCreatingStage: isCreatingStage || isLoadingForced, // For collaborate button spinner
      isStageActive,
      handleCopyJoinParticipantLinkAndNotify,
      shouldDisableCollaborateButton,
      shouldDisableCopyLinkButton,
      updateError,
      resetStage,
      isSpectator,
      hasPermissions,
      // Participants
      localParticipant,
      participants,
      // Controls
      leaveStage,
      toggleCamera,
      toggleMicrophone,
      handleOnConfirmLeaveStage
    }),
    [
      initializeStageClient,
      handleParticipantInvite,
      isCreatingStage,
      isLoadingForced,
      isStageActive,
      handleCopyJoinParticipantLinkAndNotify,
      localParticipant,
      participants,
      leaveStage,
      toggleCamera,
      toggleMicrophone,
      handleOnConfirmLeaveStage,
      shouldDisableCollaborateButton,
      shouldDisableCopyLinkButton,
      updateError,
      resetStage,
      isSpectator,
      hasPermissions
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = {
  children: PropTypes.node.isRequired,
  previewRef: PropTypes.shape({ current: PropTypes.object }).isRequired
};

export const useStage = () => useContextHook(Context);
