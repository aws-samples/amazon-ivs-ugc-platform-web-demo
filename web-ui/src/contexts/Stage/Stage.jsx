import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { useAnimationControls } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import copyToClipboard from 'copy-to-clipboard';
import PropTypes from 'prop-types';

import {
  JOIN_PARTICIPANT_URL_PARAM_KEY,
  createJoinParticipantLink,
  createUserJoinedSuccessMessage,
  getVideoConstraints
} from '../../helpers/stagesHelpers';
import { CAMERA_LAYER_NAME } from '../Broadcast/useLayers';
import { decodeJWT, retryWithExponentialBackoff } from '../../utils';
import { defaultParticipant } from './reducer/stageReducer';
import { getParticipationToken } from '../../api/stages';
import { LOCAL_KEY, STATE_KEYS } from './reducer';
import { LOCAL_STAGE_STREAM_OPTIONS as localStreamOptions } from '../../constants';
import { MICROPHONE_AUDIO_INPUT_NAME } from '../Broadcast/useAudioMixer';
import { stagesAPI } from '../../api';
import { streamManager as $streamManagerContent } from '../../content';
import { useBroadcast } from '../Broadcast';
import { useNotif } from '../Notification';
import { useStreams } from '../Streams';
import useContextHook from '../useContextHook';
import useForceLoader from '../../hooks/useForceLoader';
import useStageReducers from './useStageReducer';
import useStageControls from './useStageControls';
import usePrevious from '../../hooks/usePrevious';

const $contentNotification =
  $streamManagerContent.stream_manager_stage.notifications;
const $contentBroadcastNotif =
  $streamManagerContent.stream_manager_web_broadcast.notifications;

const {
  Stage,
  SubscribeType,
  LocalStageStream,
  StageEvents,
  StageParticipantPublishState,
  StageParticipantSubscribeState
} = window.IVSBroadcastClient;

let client;
let isDevicesInitialized = false;
let broadcastDevicesStateObj = null;
let shouldGetParticipantToken = false;

const Context = createContext(null);
Context.displayName = 'Stage';

const DELAY_COLLAPSE_ANIMATION = 500;
const ENABLE_LEAVE_SESSION_BUTTON_DELAY = 7000;
const TRACK_READY_STATE = {
  LIVE: 'live',
  ENDED: 'ended'
};

export const Provider = ({ children, previewRef: broadcastPreviewRef }) => {
  const [isClientDefined, setIsClientDefined] = useState(false);
  const joinParticipantLinkRef = useRef();
  const openFullscreenViewCallbackFunctionRef = useRef();
  const {
    state: stageState,
    addParticipant,
    removeParticipant,
    updateParticipant,
    creatingStage,
    resetStageState,
    updateAnimateCollapseStageContainerWithDelay,
    updateError,
    updateShouldAnimateGoLiveButtonChevronIcon,
    updateStageId,
    updateSuccess,
    toggleCameraState,
    toggleMicrophoneState,
    updateIsSpectator,
    updateStreams,
    updateShouldDisableStageButtonWithDelay,
    updateIsBlockingRoute
  } = useStageReducers();
  const [searchParams] = useSearchParams();
  const stageIdUrlParam = searchParams.get(JOIN_PARTICIPANT_URL_PARAM_KEY);
  const {
    animateCollapseStageContainerWithDelay,
    error,
    isCreatingStage,
    participants,
    shouldAnimateGoLiveButtonChevronIcon,
    stageId,
    success,
    shouldDisableStageButtonWithDelay,
    isSpectator,
    isBlockingRoute
  } = stageState;
  const localParticipant = participants.get(LOCAL_KEY);
  const isStageActive = !!stageId;

  const {
    removeBroadcastClient,
    restartBroadcastClient,
    isBroadcasting,
    // Devices
    activeDevices,
    devices,
    initializeDevices,
    hasPermissions,
    isCameraHidden: isBroadcastCameraHidden,
    isMicrophoneMuted: isBroadcastMicrophoneMuted
  } = useBroadcast();
  const { notifyError, notifySuccess } = useNotif();
  const { isLive } = useStreams();
  const isLoadingForced = useForceLoader();
  const navigate = useNavigate();
  const collaborateButtonAnimationControls = useAnimationControls();

  const shouldDisableCollaborateButton = isLive || isBroadcasting;
  const shouldDisableCopyLinkButton = isStageActive && isSpectator;

  const activeCameraDevice = activeDevices?.[CAMERA_LAYER_NAME];
  const activeMicrophoneDevice = activeDevices?.[MICROPHONE_AUDIO_INPUT_NAME];
  const prevActiveCameraDevice = usePrevious(activeCameraDevice);
  const prevActiveMicDevice = usePrevious(activeMicrophoneDevice);

  /**
   * Strategy
   */
  const strategy = useMemo(
    () => ({
      audioTrack: undefined,
      videoTrack: undefined,

      updateTracks(newAudioTrack, newVideoTrack) {
        this.audioTrack = newAudioTrack;
        this.videoTrack = newVideoTrack;
      },

      stageStreamsToPublish() {
        return [this.audioTrack, this.videoTrack];
      },

      shouldPublishParticipant(participant) {
        return true;
      },

      shouldSubscribeToParticipant(participant) {
        return SubscribeType.AUDIO_VIDEO;
      },

      stopTracks() {
        this.audioTrack?.mediaStreamTrack.stop();
        this.videoTrack?.mediaStreamTrack.stop();
      }
    }),
    []
  );
  /**
   * Stage event handlers
   */
  const handleParticipantJoinEvent = useCallback(
    (participant) => {
      const {
        attributes: {
          username: participantUsername,
          participantTokenCreationDate = undefined // participantTokenCreationDate is undefined for stage creator
        },
        isLocal
      } = participant;

      if (isLocal) return;

      addParticipant(participant);
      /**
       * the "if" statement assesses participant timing compared to the local participant.
       * an undefined participantTokenCreationDate signifies the participant as the stage creator.
       * if participantTokenCreationDate is earlier than joinStageDateRef.current, participants joined before the local participant.
       */
      if (
        !participantTokenCreationDate ||
        participantTokenCreationDate <
          localParticipant?.attributes.participantTokenCreationDate
      )
        return;

      const successMessage =
        createUserJoinedSuccessMessage(participantUsername);
      updateSuccess(successMessage);
    },
    [addParticipant, updateSuccess, localParticipant]
  );

  const handleParticipantLeftEvent = useCallback(
    (participant) => {
      removeParticipant(participant.userId);
    },
    [removeParticipant]
  );

  const handlePartipantStreamsAddedEvent = useCallback(
    (participant, streams) => {
      if (participant.isLocal) return;

      updateStreams(participant.userId, streams);
    },
    [updateStreams]
  );

  const handleStreamMuteChangeEvent = useCallback(
    (participant, stream) => {
      const { isLocal, userId } = participant;
      const { isMuted, streamType } = stream;
      if (isLocal) return;

      if (streamType === 'audio') {
        toggleMicrophoneState(userId, isMuted);
      }
      if (streamType === 'video') {
        toggleCameraState(userId, isMuted);
      }
    },
    [toggleMicrophoneState, toggleCameraState]
  );

  const handleParticipantPublishStateChangedEvent = useCallback(
    (participant, state) => {
      // Error code 1403 (stage at capacity) is thrown when more than 12 participants are publishing
      const shouldUpdateSpectatorState =
        state === StageParticipantPublishState.ERRORED &&
        !participant.isPublishing &&
        participant.isLocal &&
        !isSpectator;

      if (shouldUpdateSpectatorState) {
        updateIsSpectator(true);
      }
    },
    [isSpectator, updateIsSpectator]
  );

  const handleParticipantSubscribeStateChangeEvent = useCallback(
    (_, state) => {
      if (state === StageParticipantSubscribeState.ERRORED) {
        client.refreshStrategy(strategy);
      }
    },
    [strategy]
  );
  /**
   * Local participant media stream
   */
  // Get local video only stream and update video src object
  useEffect(() => {
    if (!isStageActive || isSpectator || !prevActiveCameraDevice) return;

    const isInitializingStreams = !localParticipant?.streams;
    const isActiveCamTrackStopped =
      !localParticipant?.isCameraHidden &&
      localParticipant.streams?.[0].mediaStreamTrack.readyState ===
        TRACK_READY_STATE.ENDED;
    const isActiveCamDeviceUpdated =
      prevActiveCameraDevice?.deviceId !== activeCameraDevice?.deviceId;

    if (
      !isInitializingStreams &&
      !isActiveCamTrackStopped &&
      !isActiveCamDeviceUpdated
    )
      return;

    // Stop previous track
    if (
      localParticipant?.streams &&
      localParticipant?.streams?.[0].mediaStreamTrack.readyState ===
        TRACK_READY_STATE.LIVE
    ) {
      localParticipant.streams?.[0].mediaStreamTrack.stop();
    }

    const { deviceId: cameraDeviceId = undefined } = activeCameraDevice || {};
    if (cameraDeviceId) {
      (async function () {
        try {
          const localVideoStream = await retryWithExponentialBackoff({
            promiseFn: () =>
              navigator.mediaDevices.getUserMedia({
                video: getVideoConstraints(cameraDeviceId)
              }),
            maxRetries: 2
          });

          if (localVideoStream) {
            const localVideoTrack = new LocalStageStream(
              localVideoStream.getVideoTracks()[0],
              localStreamOptions
            );
            updateStreams(LOCAL_KEY, [localVideoTrack]);
          }
        } catch (error) {
          updateError({
            message: $contentBroadcastNotif.error.failed_to_change_camera,
            err: error
          });
        }
      })();
    }
  }, [
    activeCameraDevice,
    isStageActive,
    localParticipant?.isCameraHidden,
    updateStreams,
    isSpectator,
    localParticipant?.streams,
    prevActiveCameraDevice,
    updateError
  ]);

  const updateLocalStrategy = useCallback(async () => {
    const micDeviceId = activeMicrophoneDevice?.deviceId;
    const prevCameraDeviceId = prevActiveCameraDevice?.deviceId;
    const prevMicDeviceId = prevActiveMicDevice?.deviceId;

    const isInitializingStreams = !strategy.audioTrack && !strategy.videoTrack;
    const isActiveCamTrackStopped =
      !localParticipant?.isCameraHidden &&
      strategy.videoTrack?.mediaStreamTrack.readyState ===
        TRACK_READY_STATE.ENDED;
    const isActiveMicTrackStopped =
      !localParticipant?.isMicrophoneMuted &&
      strategy.audioTrack?.mediaStreamTrack.readyState ===
        TRACK_READY_STATE.ENDED;
    const isActiveCamDeviceUpdated =
      prevCameraDeviceId !== activeCameraDevice?.deviceId;
    const isActiveMicDeviceUpdated =
      prevMicDeviceId !== activeMicrophoneDevice?.deviceId;

    if (
      (!isInitializingStreams &&
        !isActiveCamTrackStopped &&
        !isActiveMicTrackStopped &&
        !isActiveCamDeviceUpdated &&
        !isActiveMicDeviceUpdated) ||
      !localParticipant?.streams
    )
      return;

    let localAudioStream;
    try {
      localAudioStream = await retryWithExponentialBackoff({
        promiseFn: () =>
          navigator.mediaDevices.getUserMedia({
            audio: { deviceId: micDeviceId }
          }),
        maxRetries: 2
      });
    } catch (error) {
      updateError({
        message: $contentBroadcastNotif.error.failed_to_change_mic,
        err: error
      });
    }

    if (localAudioStream) {
      if (
        strategy.audioTrack?.mediaStreamTrack.readyState ===
        TRACK_READY_STATE.LIVE
      )
        strategy.audioTrack.mediaStreamTrack.stop();

      const localVideoTrack = localParticipant.streams[0];
      const localAudioTrack = new LocalStageStream(
        localAudioStream.getAudioTracks()[0],
        localStreamOptions
      );

      if (localParticipant?.isCameraHidden !== localVideoTrack.isMuted) {
        localVideoTrack.setMuted(
          localParticipant?.isCameraHidden || defaultParticipant.isCameraHidden
        );
      }
      if (localParticipant?.isMicrophoneMuted !== localAudioTrack.isMuted) {
        localAudioTrack.setMuted(
          localParticipant?.isMicrophoneMuted ||
            defaultParticipant.isMicrophoneMuted
        );
      }

      strategy.updateTracks(localAudioTrack, localVideoTrack);
      client?.refreshStrategy(strategy);
    }
  }, [
    activeCameraDevice?.deviceId,
    activeMicrophoneDevice?.deviceId,
    localParticipant?.isCameraHidden,
    localParticipant?.isMicrophoneMuted,
    localParticipant?.streams,
    updateError,
    prevActiveCameraDevice?.deviceId,
    prevActiveMicDevice?.deviceId,
    strategy
  ]);

  useEffect(() => {
    if (localParticipant?.isCameraHidden) {
      strategy.videoTrack?.mediaStreamTrack.stop();
      localParticipant?.streams?.[0]?.mediaStreamTrack.stop();
    }
  }, [
    localParticipant?.isCameraHidden,
    localParticipant?.streams,
    strategy.videoTrack?.mediaStreamTrack
  ]);

  useEffect(() => {
    if (!isDevicesInitialized || !isStageActive || !client) return;

    (async function () {
      await updateLocalStrategy();
    })();
  }, [
    activeCameraDevice,
    activeMicrophoneDevice,
    isStageActive,
    updateLocalStrategy
  ]);

  const animationCollapseStageControlsStart = useCallback(() => {
    updateShouldAnimateGoLiveButtonChevronIcon(true);

    setTimeout(() => {
      updateAnimateCollapseStageContainerWithDelay(true);
    }, DELAY_COLLAPSE_ANIMATION);
  }, [
    updateAnimateCollapseStageContainerWithDelay,
    updateShouldAnimateGoLiveButtonChevronIcon
  ]);

  const attachStageEvents = useCallback(
    (client) => {
      if (!client) return;

      client.on(
        StageEvents.STAGE_PARTICIPANT_JOINED,
        handleParticipantJoinEvent
      );
      client.on(StageEvents.STAGE_PARTICIPANT_LEFT, handleParticipantLeftEvent);
      client.on(
        StageEvents.STAGE_PARTICIPANT_STREAMS_ADDED,
        handlePartipantStreamsAddedEvent
      );
      client.on(
        StageEvents.STAGE_STREAM_MUTE_CHANGED,
        handleStreamMuteChangeEvent
      );
      client.on(
        StageEvents.STAGE_PARTICIPANT_PUBLISH_STATE_CHANGED,
        handleParticipantPublishStateChangedEvent
      );
      client.on(
        StageEvents.STAGE_PARTICIPANT_SUBSCRIBE_STATE_CHANGED,
        handleParticipantSubscribeStateChangeEvent
      );
    },
    [
      handleParticipantJoinEvent,
      handleParticipantLeftEvent,
      handleParticipantPublishStateChangedEvent,
      handleParticipantSubscribeStateChangeEvent,
      handlePartipantStreamsAddedEvent,
      handleStreamMuteChangeEvent
    ]
  );

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

      client = new Stage(token, strategy);
      setIsClientDefined(!!client);

      attachStageEvents(client);

      await updateLocalStrategy();

      await client.join();
    },
    [
      updateIsBlockingRoute,
      localParticipant,
      updateStageId,
      strategy,
      attachStageEvents,
      updateLocalStrategy,
      updateParticipant,
      addParticipant,
      isBroadcastCameraHidden,
      isBroadcastMicrophoneMuted
    ]
  );

  useEffect(() => {
    // Initialize Web Broadcast client once stage has been left
    if (
      !!broadcastDevicesStateObj &&
      !isStageActive &&
      broadcastPreviewRef?.current
    ) {
      restartBroadcastClient(
        broadcastDevicesStateObj.isCameraHidden,
        broadcastDevicesStateObj.isMicrophoneMuted
      );
      broadcastDevicesStateObj = null;
    }
  }, [broadcastPreviewRef, restartBroadcastClient, isStageActive]);

  const resetStage = useCallback(
    (showSuccess = false) => {
      // Stop all tracks
      if (localParticipant?.streams)
        localParticipant?.streams[0].mediaStreamTrack.stop();
      strategy.stopTracks();

      if (client) {
        client.removeAllListeners();
        client.leave();
        client = undefined;
      }
      if (showSuccess) {
        updateSuccess($contentNotification.success.you_have_left_the_session);
        resetStageState({ omit: [STATE_KEYS.SUCCESS] });
      } else {
        resetStageState();
      }
      joinParticipantLinkRef.current = undefined;
      isDevicesInitialized = false;
      broadcastDevicesStateObj = null;
      shouldGetParticipantToken = false;
    },
    [strategy, resetStageState, updateSuccess, localParticipant]
  );

  const leaveStage = useCallback(() => {
    // Disable usePrompt
    updateIsBlockingRoute(false);

    // Animate stage control buttons
    updateAnimateCollapseStageContainerWithDelay(false);
    updateShouldAnimateGoLiveButtonChevronIcon(false);

    setTimeout(() => {
      resetStage(true);
      if (stageIdUrlParam) navigate('/manager');
      broadcastDevicesStateObj = {
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
    localParticipant?.isMicrophoneMuted
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

  const handleCopyJoinParticipantLinkAndNotify = useCallback(() => {
    copyToClipboard(joinParticipantLinkRef.current);
    updateSuccess(
      $contentNotification.success.session_link_has_been_copied_to_clipboard
    );
  }, [updateSuccess]);

  const initializeStageClient = useCallback(
    async (openFullscreenViewCallbackFunction) => {
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

  const handleParticipantInvite = useCallback(
    ({ isLive, isBroadcasting, openFullscreenView, profileData }) => {
      if (isLive === undefined || isBroadcasting === undefined) return;
      removeBroadcastClient();

      if (isLive || isBroadcasting) {
        restartBroadcastClient();
        updateError({
          message: $contentNotification.error.unable_to_join_session
        });
        navigate('/manager');
      } else {
        const { avatar, profileColor, username, channelAssetUrls } =
          profileData;
        const localParticipant = {
          attributes: {
            avatar,
            profileColor,
            username,
            channelAssetUrls,
            participantTokenCreationDate: Date.now().toString()
          },
          isLocal: true,
          userId: undefined
        };

        updateStageId(stageIdUrlParam);
        addParticipant(localParticipant);
        openFullscreenViewCallbackFunctionRef.current = openFullscreenView;
        shouldGetParticipantToken = true;
      }
    },
    [
      removeBroadcastClient,
      restartBroadcastClient,
      updateError,
      navigate,
      updateStageId,
      stageIdUrlParam,
      addParticipant
    ]
  );

  useEffect(() => {
    if (shouldGetParticipantToken && hasPermissions && stageId) {
      shouldGetParticipantToken = false;
      (async function () {
        const { result, error } = await getParticipationToken(stageId);

        if (result?.token) {
          await createStageInstanceAndJoin(result.token, stageId);

          // open fullscreen view
          openFullscreenViewCallbackFunctionRef.current();
        }

        if (error) {
          resetStage();
          updateError({
            message: $contentNotification.error.unable_to_join_session,
            err: error
          });
          navigate('/manager');
          broadcastDevicesStateObj = {
            isCameraHidden: localParticipant?.isCameraHidden || false,
            isMicrophoneMuted: localParticipant?.isMicrophoneMuted || false
          };
        }

        // reset openFullscreenViewCallbackFunctionRef
        openFullscreenViewCallbackFunctionRef.current = undefined;
      })();
    }
  }, [
    hasPermissions,
    stageId,
    createStageInstanceAndJoin,
    updateError,
    removeBroadcastClient,
    addParticipant,
    localParticipant,
    updateStageId,
    stageIdUrlParam,
    restartBroadcastClient,
    navigate,
    updateParticipant,
    resetStage
  ]);

  useEffect(() => {
    if (!isStageActive || isDevicesInitialized) return;

    const cameraDevices = devices?.[CAMERA_LAYER_NAME] || [];
    const microphoneDevices = devices?.[MICROPHONE_AUDIO_INPUT_NAME] || [];

    if (!!cameraDevices.length && !!microphoneDevices.length) {
      isDevicesInitialized = true;
    } else {
      (async function () {
        await initializeDevices();
        isDevicesInitialized = true;
      })();
    }
  }, [initializeDevices, isStageActive, devices]);

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

  useEffect(() => {
    if (isClientDefined && client) {
      window.addEventListener('beforeunload', () => {
        queueMicrotask(setTimeout(() => client.leave(), 0));
      });
    }
  }, [isClientDefined]);

  const value = useMemo(
    () => ({
      initializeStageClient,
      handleParticipantInvite,
      isCreatingStage: isCreatingStage || isLoadingForced, // For collaborate button spinner
      isStageActive,
      shouldDisableStageButtonWithDelay,
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
      handleOnConfirmLeaveStage,
      // Animations
      animateCollapseStageContainerWithDelay,
      animationCollapseStageControlsStart,
      collaborateButtonAnimationControls,
      shouldAnimateGoLiveButtonChevronIcon,
      updateAnimateCollapseStageContainerWithDelay,
      updateShouldAnimateGoLiveButtonChevronIcon
    }),
    [
      initializeStageClient,
      handleParticipantInvite,
      isCreatingStage,
      isLoadingForced,
      isStageActive,
      shouldDisableStageButtonWithDelay,
      handleCopyJoinParticipantLinkAndNotify,
      localParticipant,
      participants,
      leaveStage,
      toggleCamera,
      toggleMicrophone,
      handleOnConfirmLeaveStage,
      animateCollapseStageContainerWithDelay,
      animationCollapseStageControlsStart,
      collaborateButtonAnimationControls,
      shouldAnimateGoLiveButtonChevronIcon,
      updateAnimateCollapseStageContainerWithDelay,
      updateShouldAnimateGoLiveButtonChevronIcon,
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
