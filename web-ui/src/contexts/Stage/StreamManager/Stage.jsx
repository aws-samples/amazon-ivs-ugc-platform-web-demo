import { createContext, useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import copyToClipboard from 'copy-to-clipboard';
import PropTypes from 'prop-types';

import { CAMERA_LAYER_NAME } from '../../Broadcast/useLayers';
import {
  createJoinParticipantLink,
  JOIN_PARTICIPANT_URL_PARAM_KEY,
  getStageParticipantsChannelIds
} from '../../../helpers/stagesHelpers';
import {
  defaultParticipant,
  LOCAL_KEY,
  PARTICIPANT_TYPES
} from '../Global/reducer/globalReducer';
import { decodeJWT, retryWithExponentialBackoff } from '../../../utils';
import { ENABLE_LEAVE_SESSION_BUTTON_DELAY } from '../Global/Global';
import { MICROPHONE_AUDIO_INPUT_NAME } from '../../Broadcast/useAudioMixer';
import { stagesAPI } from '../../../api';
import { streamManager as $streamManagerContent } from '../../../content';
import { useAppSync } from '../../AppSync';
import { useBroadcast } from '../../Broadcast';
import { useChannel } from '../../Channel';
import { useGlobalStage } from '../../Stage';
import { useNotif } from '../../Notification';
import { useStreams } from '../../Streams';
import { useModal } from '../../Modal';
import useContextHook from '../../useContextHook';
import useForceLoader from '../../../hooks/useForceLoader';
import useInviteParticipants from '../../../pages/StreamManager/hooks/useInviteParticipants';
import useStageControls from './useStageControls';
import useStageStrategy from '../../../pages/StreamManager/hooks/useStageStrategy';
import useStageClient from '../../../hooks/useStageClient';
import channelEvents from '../../AppSync/channelEvents';
import useRequestParticipants from '../../../pages/StreamManager/hooks/useRequestParticipants';

const $contentNotification =
  $streamManagerContent.stream_manager_stage.notifications;

const Context = createContext(null);
Context.displayName = 'Stage';

export const Provider = ({ children, previewRef: broadcastPreviewRef }) => {
  const {
    participants,
    addParticipant,
    updateParticipant,
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
    isSpectator,
    shouldDisableStageButtonWithDelay,
    isCreatingStage,
    isHost,
    updateShouldCloseFullScreenViewOnKickedOrHostLeave,
    shouldCloseFullScreenViewOnKickedOrHostLeave,
    updateIsJoiningStageByRequest,
    isJoiningStageByInvite,
    isJoiningStageByRequest
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
    devices,
    initializeDevices,
    hasPermissions
  } = useBroadcast();
  const { notifyError, notifySuccess, notifyNeutral } = useNotif();
  const { isLive } = useStreams();
  const isLoadingForced = useForceLoader();
  const navigate = useNavigate();
  const { refreshChannelData } = useChannel();
  const { publish } = useAppSync();
  const { state } = useLocation();
  const { closeModal } = useModal();

  useEffect(() => {
    if (!state?.isJoiningStageByRequest) return;

    updateIsJoiningStageByRequest(true);
  }, [navigate, state?.isJoiningStageByRequest, updateIsJoiningStageByRequest]);

  const isDevicesInitializedRef = useRef(false);
  const joinParticipantLinkRef = useRef();
  const broadcastDevicesStateObjRef = useRef(null);
  const shouldGetParticipantTokenRef = useRef(false);
  const shouldGetHostRejoinTokenRef = useRef(true);

  const shouldDisableCollaborateButton = isLive || isBroadcasting;
  const shouldDisableCopyLinkButton = isStageActive && isSpectator;
  const participantChannels = useRef([]);

  const stageConnectionErroredEventCallback = useCallback(() => {
    updateIsBlockingRoute(false);

    if (!isHost) shouldGetHostRejoinTokenRef.current = false;

    if (state?.isJoiningStageByRequest) {
      navigate('/manager', { state: {} });
    }

    updateShouldCloseFullScreenViewOnKickedOrHostLeave(true);
  }, [
    isHost,
    navigate,
    state?.isJoiningStageByRequest,
    updateIsBlockingRoute,
    updateShouldCloseFullScreenViewOnKickedOrHostLeave
  ]);

  const { joinStageClient, resetAllStageState, leaveStageClient, client } =
    useStageClient({
      updateSuccess,
      updateError,
      isDevicesInitializedRef,
      stageConnectionErroredEventCallback
    });

  const resetStage = useCallback(() => {
    // Stop all tracks
    if (localParticipant?.streams)
      localParticipant?.streams[0].mediaStreamTrack.stop();

    resetAllStageState();

    joinParticipantLinkRef.current = undefined;
    isDevicesInitializedRef.current = false;
    broadcastDevicesStateObjRef.current = null;
    shouldGetParticipantTokenRef.current = false;
  }, [localParticipant?.streams, resetAllStageState]);

  const leaveStage = useCallback(
    async (shouldShowSuccessNotification = false) => {
      try {
        let result;
        participantChannels.current =
          getStageParticipantsChannelIds(participants);

        leaveStageClient();

        // Check if the user is the host
        if (isHost) {
          ({ result } = await retryWithExponentialBackoff({
            promiseFn: () => stagesAPI.deleteStage(),
            maxRetries: 2
          }));

          // Fetch updated channel data
          refreshChannelData();

          // Disable usePrompt
          updateIsBlockingRoute(false);
        }

        if (result || !isHost) {
          if (isHost) {
            notifyNeutral($contentNotification.neutral.the_session_ended, {
              asPortal: true
            });

            if (participantChannels.current.length) {
              participantChannels.current.forEach((participantChannel) => {
                const channel = participantChannel?.toLowerCase();
                publish(
                  channel,
                  JSON.stringify({
                    type: channelEvents.STAGE_SESSION_HAS_ENDED
                  })
                );
              });
            }
          }

          // Animate stage control buttons
          updateAnimateCollapseStageContainerWithDelay(false);
          updateShouldAnimateGoLiveButtonChevronIcon(false);

          setTimeout(() => {
            resetStage();

            if (shouldShowSuccessNotification) {
              updateSuccess(
                $contentNotification.success.you_have_left_the_session
              );
            }

            if (stageIdUrlParam) {
              navigate('/manager');
            }

            if (state?.isJoiningStageByRequest) {
              navigate('/manager', { state: {} });
            }

            broadcastDevicesStateObjRef.current = {
              isCameraHidden: localParticipant?.isCameraHidden || false,
              isMicrophoneMuted: localParticipant?.isMicrophoneMuted || false
            };
          }, 350);
        }
      } catch (err) {
        updateError({
          message: $contentNotification.error.unable_to_leave_session,
          err
        });
      }
    },
    [
      participants,
      leaveStageClient,
      isHost,
      refreshChannelData,
      updateIsBlockingRoute,
      updateAnimateCollapseStageContainerWithDelay,
      updateShouldAnimateGoLiveButtonChevronIcon,
      notifyNeutral,
      publish,
      resetStage,
      stageIdUrlParam,
      state?.isJoiningStageByRequest,
      localParticipant?.isCameraHidden,
      localParticipant?.isMicrophoneMuted,
      updateSuccess,
      navigate,
      updateError
    ]
  );

  useEffect(() => {
    if (!shouldCloseFullScreenViewOnKickedOrHostLeave) return;
    leaveStage();
  }, [leaveStage, shouldCloseFullScreenViewOnKickedOrHostLeave]);

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
      const { type } = attributes;

      if (type === PARTICIPANT_TYPES.HOST) {
        shouldGetHostRejoinTokenRef.current = true;
        // From this point, changing routes will prompt confirmation modal for host
        updateIsBlockingRoute(true);
      }

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
          isBroadcastCameraHidden || defaultParticipant?.isCameraHidden,
        isMicrophoneMuted:
          isBroadcastMicrophoneMuted || defaultParticipant?.isMicrophoneMuted
      };

      if (localParticipant) {
        // update local participant
        updateParticipant(LOCAL_KEY, localParticipantObject);
      } else {
        addParticipant(localParticipantObject);
      }

      updateStageId(stageId);
      joinParticipantLinkRef.current = createJoinParticipantLink(stageId);

      closeModal();

      // TODO: try catch block
      await joinStageClient({ token, strategy });
      await updateLocalStrategy();
    },
    [
      isBroadcastCameraHidden,
      isBroadcastMicrophoneMuted,
      localParticipant,
      updateStageId,
      closeModal,
      joinStageClient,
      strategy,
      updateLocalStrategy,
      updateIsBlockingRoute,
      updateParticipant,
      addParticipant
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
      stageId,
      creatingStage,
      removeBroadcastClient,
      updateShouldDisableStageButtonWithDelay,
      createStageInstanceAndJoin,
      updateError
    ]
  );

  const { handleParticipantInvite } = useInviteParticipants({
    shouldGetParticipantTokenRef,
    createStageInstanceAndJoin,
    updateError,
    resetStage,
    broadcastDevicesStateObjRef,
    shouldGetHostRejoinTokenRef
  });

  const { joinStageByRequest } = useRequestParticipants({
    createStageInstanceAndJoin
  });

  const handleParticipantJoinStage = useCallback(() => {
    if (isJoiningStageByInvite) {
      handleParticipantInvite();
    }

    if (isJoiningStageByRequest) {
      joinStageByRequest();
    }
  }, [
    handleParticipantInvite,
    isJoiningStageByInvite,
    isJoiningStageByRequest,
    joinStageByRequest
  ]);

  const handleCopyJoinParticipantLinkAndNotify = useCallback(() => {
    copyToClipboard(joinParticipantLinkRef.current);
    updateSuccess(
      $contentNotification.success.session_link_has_been_copied_to_clipboard
    );
  }, [joinParticipantLinkRef, updateSuccess]);

  const { toggleCamera, toggleMicrophone, handleOnConfirmLeaveStage } =
    useStageControls({ leaveStage, resetStage });

  // Stage controls visibility
  const stageControlsVisibility = useMemo(
    () => ({
      shouldRenderFullscreenCollapseCloseButton: [
        PARTICIPANT_TYPES.HOST,
        PARTICIPANT_TYPES.INVITED
      ].includes(localParticipant?.attributes?.type),
      shouldRenderInviteLinkButton: [
        PARTICIPANT_TYPES.HOST,
        PARTICIPANT_TYPES.INVITED
      ].includes(localParticipant?.attributes?.type),
      shouldRenderShareScreenButton: [
        PARTICIPANT_TYPES.HOST,
        PARTICIPANT_TYPES.INVITED
      ].includes(localParticipant?.attributes?.type)
    }),
    [localParticipant?.attributes?.type]
  );

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
        broadcastDevicesStateObjRef.current?.isCameraHidden,
        broadcastDevicesStateObjRef.current?.isMicrophoneMuted
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
      handleParticipantJoinStage,
      // Controls
      leaveStage,
      toggleCamera,
      toggleMicrophone,
      handleOnConfirmLeaveStage,
      shouldCloseFullScreenViewOnKickedOrHostLeave,
      broadcastDevicesStateObjRef,
      createStageInstanceAndJoin,
      shouldGetHostRejoinTokenRef,
      stageControlsVisibility,
      joinStageByRequest
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
      hasPermissions,
      shouldCloseFullScreenViewOnKickedOrHostLeave,
      createStageInstanceAndJoin,
      shouldGetHostRejoinTokenRef,
      stageControlsVisibility,
      joinStageByRequest,
      handleParticipantJoinStage
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = {
  children: PropTypes.node.isRequired,
  previewRef: PropTypes.shape({ current: PropTypes.object }).isRequired
};

export const useStage = () => useContextHook(Context);
