import { createContext, useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
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
  PARTICIPANT_TYPES
} from '../Global/reducer/globalReducer';
import { decodeJWT, retryWithExponentialBackoff } from '../../../utils';
import { ENABLE_LEAVE_SESSION_BUTTON_DELAY } from '../Global/Global';
import { MICROPHONE_AUDIO_INPUT_NAME } from '../../Broadcast/useAudioMixer';
import { stagesAPI } from '../../../api';
import { streamManager as $streamManagerContent } from '../../../content';
import { useBroadcast } from '../../Broadcast';
import { useChannel } from '../../Channel';
import { useGlobalStage } from '../../Stage';
import { useNotif } from '../../Notification';
import { useStreams } from '../../Streams';
import { MODAL_TYPE, useModal } from '../../Modal';
import useContextHook from '../../useContextHook';
import useForceLoader from '../../../hooks/useForceLoader';
import useInviteParticipants from '../../../pages/StreamManager/hooks/useInviteParticipants';
import useStageControls from './useStageControls';
import useStageStrategy from '../../../pages/StreamManager/hooks/useStageStrategy';
import useStageClient from '../../../hooks/useStageClient';
import useRequestParticipants from '../../../pages/StreamManager/hooks/useRequestParticipants';
import useStageScreenshare from '../../../pages/StreamManager/hooks/useStageScreenshare';
import { RESOURCE_NOT_FOUND_EXCEPTION } from '../../../constants';

const $contentNotification =
  $streamManagerContent.stream_manager_stage.notifications;

const Context = createContext(null);
Context.displayName = 'Stage';

export const Provider = ({ children, previewRef: broadcastPreviewRef }) => {
  const {
    addParticipant,
    creatingStage,
    error,
    isCreatingStage,
    isHost,
    isJoiningStageByInvite,
    isJoiningStageByRequest,
    isScreensharing,
    isSpectator,
    isStageActive,
    localParticipant,
    localScreenshareStream,
    participants,
    shouldDisableStageButtonWithDelay,
    stageId,
    strategy,
    success,
    updateAnimateCollapseStageContainerWithDelay,
    updateError,
    updateIsBlockingRoute,
    updateIsJoiningStageByRequest,
    updateParticipant,
    updateShouldAnimateGoLiveButtonChevronIcon,
    updateShouldDisableStageButtonWithDelay,
    updateStageId,
    updateSuccess,
    updateShouldCloseFullScreenViewOnConnectionError,
    shouldCloseFullScreenViewOnConnectionError,
    isJoiningStageByRequestOrInvite
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
  const { state } = useLocation();
  const { closeModal, openModal, isModalOpen } = useModal();
  const isClosingJoinModal = useRef(false);

  useEffect(() => {
    if (!state?.isJoiningStageByRequest) return;

    updateIsJoiningStageByRequest(true);
  }, [navigate, state?.isJoiningStageByRequest, updateIsJoiningStageByRequest]);

  const isDevicesInitializedRef = useRef(false);
  const joinParticipantLinkRef = useRef();
  const broadcastDevicesStateObjRef = useRef(null);
  const shouldGetHostRejoinTokenRef = useRef(true);

  const shouldDisableCollaborateButton = isLive || isBroadcasting;
  const shouldDisableCopyLinkButton = isStageActive && isSpectator;

  const stageConnectionErroredEventCallback = useCallback(() => {
    updateIsBlockingRoute(false);

    if (!isHost) shouldGetHostRejoinTokenRef.current = false;

    if (state?.isJoiningStageByRequest) {
      navigate('/manager', { state: {} });
    }

    updateShouldCloseFullScreenViewOnConnectionError(true);
  }, [
    isHost,
    navigate,
    state?.isJoiningStageByRequest,
    updateIsBlockingRoute,
    updateShouldCloseFullScreenViewOnConnectionError
  ]);

  // Stage Client
  const { joinStageClient, resetAllStageState, leaveStageClient, client } =
    useStageClient({
      updateSuccess,
      updateError,
      stageConnectionErroredEventCallback
    });

  // Real-Time Screenshare
  const {
    joinStageClient: joinStageScreenshareClient,
    leaveStageClient: leaveStageScreenshareClient
  } = useStageClient({
    updateSuccess,
    updateError
  });
  const { stopScreenshare } = useStageScreenshare({
    joinStageScreenshareClient,
    leaveStageScreenshareClient
  });

  useEffect(() => {
    if (!isScreensharing) return;

    const [screenCaptureTrack] = localScreenshareStream?.getVideoTracks() || [];

    if (screenCaptureTrack)
      screenCaptureTrack.addEventListener('ended', stopScreenshare);

    return () => {
      if (screenCaptureTrack)
        screenCaptureTrack.removeEventListener('ended', stopScreenshare);
    };
  }, [localScreenshareStream, stopScreenshare, isScreensharing]);

  const resetStage = useCallback(() => {
    // Stop all tracks
    if (localParticipant?.streams)
      localParticipant?.streams[0].mediaStreamTrack.stop();

    resetAllStageState();

    joinParticipantLinkRef.current = undefined;
    isDevicesInitializedRef.current = false;
    broadcastDevicesStateObjRef.current = null;
  }, [localParticipant?.streams, resetAllStageState]);

  const displaySessionEndedNotification = useCallback(
    async (isHost, stageConnectionErrored) => {
      const sessionEndedByHost = isHost && !stageConnectionErrored;
      const sessionEndedAsParticipant = !isHost && stageConnectionErrored;

      if (sessionEndedByHost) {
        notifyNeutral($contentNotification.neutral.the_session_ended, {
          asPortal: true
        });
      }

      // Session ends when participant is kicked, host ends session or host leaves and does not return within 3 minutes
      if (sessionEndedAsParticipant) {
        try {
          const { error } = await retryWithExponentialBackoff({
            promiseFn: () => stagesAPI.getStage(stageId),
            maxRetries: 3,
            shouldReturnErrorOnValidation: (result) =>
              result?.error?.__type === RESOURCE_NOT_FOUND_EXCEPTION
          });

          if (error?.__type === RESOURCE_NOT_FOUND_EXCEPTION) {
            notifyNeutral($contentNotification.neutral.the_session_ended, {
              asPortal: true
            });
          }
        } catch (err) {
          console.error(err);
        }
      }
    },
    [notifyNeutral, stageId]
  );

  const leaveStage = useCallback(
    async ({
      stageConnectionErrored = false,
      shouldShowSuccessNotification = false
    }) => {
      try {
        let result;

        if (isScreensharing) stopScreenshare();

        leaveStageClient();

        // Check if the user is the host
        if (isHost) {
          shouldGetHostRejoinTokenRef.current = false;

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
          await displaySessionEndedNotification(isHost, stageConnectionErrored);

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
      stopScreenshare,
      isScreensharing,
      leaveStageClient,
      isHost,
      refreshChannelData,
      updateIsBlockingRoute,
      displaySessionEndedNotification,
      updateAnimateCollapseStageContainerWithDelay,
      updateShouldAnimateGoLiveButtonChevronIcon,
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

  const leaveStageInvoked = useRef(false);

  useEffect(() => {
    if (!shouldCloseFullScreenViewOnConnectionError) return;

    if (!leaveStageInvoked.current) {
      leaveStage({ stageConnectionErrored: true });
    }
    leaveStageInvoked.current = true;
  }, [leaveStage, shouldCloseFullScreenViewOnConnectionError]);

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
          channelAssetsAvatarUrl: !!attributes.channelAssetsAvatarUrl
            ? decodeURIComponent(attributes.channelAssetsAvatarUrl)
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

      await joinStageClient({ token, strategy });
      await updateLocalStrategy();

      closeModal({ shouldCancel: false, shouldRefocus: false });
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

  const handleCloseJoinModal = useCallback(() => {
    isClosingJoinModal.current = true;
    setTimeout(() => {
      window.history.replaceState({}, document.title);
      window.location.href = '/manager';
    }, 100);
  }, []);

  const { handleParticipantInvite } = useInviteParticipants({
    createStageInstanceAndJoin,
    updateError,
    shouldGetHostRejoinTokenRef,
    handleCloseJoinModal
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

  const handleOpenJoinModal = useCallback(() => {
    if (
      !client &&
      !isModalOpen &&
      isJoiningStageByRequestOrInvite &&
      !isClosingJoinModal.current
    ) {
      openModal({
        type: MODAL_TYPE.STAGE_JOIN,
        onCancel: handleCloseJoinModal
      });
    }
  }, [
    client,
    isModalOpen,
    openModal,
    handleCloseJoinModal,
    isJoiningStageByRequestOrInvite
  ]);

  const {
    toggleCamera,
    toggleMicrophone,
    handleOnConfirmLeaveStage,
    toggleScreenshare
  } = useStageControls({
    leaveStage,
    resetStage,
    joinStageScreenshareClient,
    leaveStageScreenshareClient
  });

  // Stage controls visibility
  const stageControlsVisibility = useMemo(
    () => ({
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

      if (err) console.error(err, message);

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
      handleOpenJoinModal,
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
      shouldCloseFullScreenViewOnConnectionError,
      broadcastDevicesStateObjRef,
      createStageInstanceAndJoin,
      shouldGetHostRejoinTokenRef,
      stageControlsVisibility,
      joinStageByRequest,
      toggleScreenshare
    }),
    [
      createStageInstanceAndJoin,
      handleOpenJoinModal,
      handleCopyJoinParticipantLinkAndNotify,
      handleOnConfirmLeaveStage,
      handleParticipantInvite,
      handleParticipantJoinStage,
      hasPermissions,
      initializeStageClient,
      isCreatingStage,
      isLoadingForced,
      isSpectator,
      isStageActive,
      joinStageByRequest,
      leaveStage,
      localParticipant,
      participants,
      resetStage,
      shouldCloseFullScreenViewOnConnectionError,
      shouldDisableCollaborateButton,
      shouldDisableCopyLinkButton,
      shouldGetHostRejoinTokenRef,
      stageControlsVisibility,
      toggleScreenshare,
      toggleCamera,
      toggleMicrophone,
      updateError
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = {
  children: PropTypes.node.isRequired,
  previewRef: PropTypes.shape({ current: PropTypes.object }).isRequired
};

export const useStage = () => useContextHook(Context);
