import {
  createContext,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  useAsyncValue,
  useLoaderData,
  useLocation,
  useNavigate
} from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import copyToClipboard from 'copy-to-clipboard';
import PropTypes from 'prop-types';

import { useLocalStorage } from './hooks';
import useContextHook from '../useContextHook';
import { PARTICIPANT_GROUP } from './constants';
import useStage from './useStage';
import { useDeviceManager } from '../DeviceManager';
import StageFactory from './StageFactory';
import { streamManager as $streamManagerContent } from '../../content';
import { stagesAPI } from '../../api';
import { useModal } from '../Modal';
import {
  STAGE_ID_URL_PARAM,
  createUserJoinedSuccessMessage
} from '../../helpers/stagesHelpers';
import { useUser } from '../User';
import { apiBaseUrl } from '../../api/utils';
import {
  STREAM_MODES,
  updateGoLiveContainerStates,
  updateUserMediaStates,
  updateStreamMode,
  updateDisplayMediaStates,
  updateStageJoinTime
} from '../../reducers/streamManager';
import {
  COLLABORATE_HOST_STATUS,
  finalizeCollaborationExit,
  updateCollaborateStates,
  updateError,
  updateSuccess
} from '../../reducers/shared';
import channelEvents from '../AppSync/channelEvents';
import { useAppSync } from '../AppSync';
import {
  COLLABORATE_ROUTE_PATH,
  PARTICIPANT_TYPES,
  STAGE_LEFT_REASONS
} from '../../constants';
import useFetchHostData from '../../pages/StreamManager/hooks/useFetchHostData';

const {
  StageConnectionState,
  StageEvents,
  StageParticipantPublishState,
  StreamType
} = window.IVSBroadcastClient;
const { PUBLISHED } = StageParticipantPublishState;
const { CONNECTED, CONNECTING } = StageConnectionState;

const $contentNotification =
  $streamManagerContent.stream_manager_stage.notifications;

const { leaveStages, destroyStages } = StageFactory;

const Context = createContext(null);
Context.displayName = 'StageManager';

function useStageManager() {
  return useContextHook(Context, false);
}

function StageManagerProvider({ children }) {
  const dispatch = useDispatch();
  const {
    collaborate: {
      participantType,
      isLeaving: isLeavingStage,
      leftReason: stageLeftReason,
      isJoining: isJoiningStage,
      stageId: storedStageId,
      host
    }
  } = useSelector((state) => state.shared);
  const {
    userMedia,
    displayMedia,
    stageJoinTime: localStageJoinTime,
    streamMode
  } = useSelector((state) => state.streamManager);
  const navigate = useNavigate();
  const { publish } = useAppSync();
  const isEnterLockedRef = useRef(false); // If true, participant has entered the collaborate session
  const isLeavingStreamManagerRef = useRef(false); // If true, when leaving stage, will not force navigate to the '/manager' route
  const { pathname } = useLocation();
  const { closeModal } = useModal();
  const { userData } = useUser();

  // Stage config and options (from page loader)
  const asyncValue = useAsyncValue();
  const loaderData = useLoaderData();
  const {
    [PARTICIPANT_GROUP.USER]: userConfig,
    [PARTICIPANT_GROUP.DISPLAY]: displayConfig,
    stageId: loaderDataStageId
  } = asyncValue ?? loaderData;
  const stageId = storedStageId || loaderDataStageId;
  const [audioOnly] = useLocalStorage('audioOnly');
  const [simulcast] = useLocalStorage('simulcast');
  const userOptions = { audioOnly, simulcast };

  // Fetch Host Data using SWR
  const { hostChannelData, fetchHostChannelError, setShouldFetchHostData } =
    useFetchHostData();

  // Stage instances
  const userStage = useStage(userConfig, userOptions);
  const displayStage = useStage(displayConfig);

  // User stage status
  const { connectState: userConnectState, join: joinUserStage } = userStage;

  // Local participant
  const publishingLocalParticipant = userStage.getParticipants({
    isPublishing: true,
    canSubscribeTo: true,
    isLocal: true
  })[0];

  // Invite URL
  const url = new URL(window.location.href);
  const [inviteUrl] = useState(
    stageId
      ? `${url.origin}${COLLABORATE_ROUTE_PATH}?${STAGE_ID_URL_PARAM}=${stageId}`
      : null
  );

  /**
   * On the stream manager page,
   * When joining participant is local, save own join time
   * This own join time is used to notify the user when new participants join
   * by comparing both participant's join times.
   * Also, use AppSync to delete request to join session.
   */
  const handleSessionJoined = useCallback(
    (participant) => {
      const joinTime = new Date().toISOString();
      const {
        attributes: {
          username,
          participantGroup,
          type: participantType,
          channelId
        },
        isLocal: isLocalParticipant
      } = participant;
      const joinNotificationBuffer = 3000; // This buffer prevents join notifications for participants who were already in the session when the local user joined (ms)
      if (isLocalParticipant) {
        dispatch(updateStageJoinTime(joinTime));
      } else if (!isLocalParticipant && localStageJoinTime) {
        const localStageJoinTimeMs = Date.parse(localStageJoinTime);
        const joinTimeMs = Date.parse(joinTime);
        /**
         * Display the "participant joined session" notification only if the local participant
         * joined the session later than the joining participant.
         * This approach prevents notifications for participants who were already
         * in the session when the local user joined.
         */
        if (joinTimeMs - localStageJoinTimeMs > joinNotificationBuffer) {
          const successMessage = createUserJoinedSuccessMessage(
            username,
            participantGroup
          );
          dispatch(updateSuccess(successMessage));
        }
      }

      if (PARTICIPANT_TYPES.REQUESTED === participantType) {
        publish(
          channelId.toLowerCase(),
          JSON.stringify({
            type: channelEvents.STAGE_HOST_DELETE_REQUEST_TO_JOIN,
            channelId
          })
        );
      }
    },
    [dispatch, localStageJoinTime, publish]
  );

  useEffect(() => {
    if (pathname !== COLLABORATE_ROUTE_PATH || !userStage) return;

    userStage.on(StageEvents.STAGE_PARTICIPANT_JOINED, handleSessionJoined);

    return () => {
      userStage.off(StageEvents.STAGE_PARTICIPANT_JOINED, handleSessionJoined);
    };
  }, [
    userStage,
    publishingLocalParticipant,
    dispatch,
    publish,
    handleSessionJoined,
    pathname,
    streamMode
  ]);

  /**
   * User Media
   */
  const {
    userMedia: {
      toggleAudio,
      toggleVideo,
      updateActiveDevice,
      mediaStream: userMediaStream,
      publishState,
      subscribeOnly,
      stopUserMedia,
      startUserMedia
    },
    displayMedia: {
      stopScreenShare,
      mediaStreamToPublish,
      setMediaStreamToPublish
    },
    stopDevices
  } = useDeviceManager();

  const userPublishStateDeferred = useDeferredValue(publishState);
  const userUnpublished =
    subscribeOnly && userPublishStateDeferred === PUBLISHED;

  // If available, the audio local stage stream should be the source of truth for the next muted state
  const toggleLocalStreamAudio = useCallback(
    ({ muted }) => {
      const isAudioLocalStageStreamMuted =
        userStage.toggleLocalStageStreamMutedState(StreamType.AUDIO, muted);

      toggleAudio({ muted: isAudioLocalStageStreamMuted });
    },
    [toggleAudio, userStage]
  );

  // If available, the video local stage stream should be the source of truth for the next muted state
  const toggleLocalStreamVideo = useCallback(
    ({ stopped }) => {
      const isVideoLocalStageStreamMuted =
        userStage.toggleLocalStageStreamMutedState(StreamType.VIDEO, stopped);
      toggleVideo({ stopped: isVideoLocalStageStreamMuted });
    },
    [toggleVideo, userStage]
  );

  // when the media stream is updated, should also update the stage streams to publish
  useEffect(() => {
    if (
      typeof userStage.updateStreamsToPublish === 'function' &&
      userMedia.shouldUpdate
    ) {
      userStage.updateStreamsToPublish(userMediaStream);
      dispatch(updateUserMediaStates({ shouldUpdate: false }));
    }
  }, [userMediaStream, userMedia.shouldUpdate, userStage, dispatch]);

  useEffect(() => {
    if (userUnpublished) {
      console.log('User unpublished... Stopping user media');
      stopUserMedia();
    }
  }, [userUnpublished, stopUserMedia]);

  /**
   * Display (screen-share) Media
   */
  const screensharePublishStateDeferred = useDeferredValue(publishState);
  const screenshareUnpublished =
    subscribeOnly && screensharePublishStateDeferred === PUBLISHED;

  useEffect(() => {
    if (mediaStreamToPublish) {
      displayStage.publish(mediaStreamToPublish);
      setMediaStreamToPublish(null);
    }
  }, [displayStage, mediaStreamToPublish, setMediaStreamToPublish]);

  useEffect(() => {
    if (displayMedia.shouldUnpublish) {
      displayStage.unpublish();
      dispatch(
        updateDisplayMediaStates({
          shouldUnpublish: false
        })
      );
    }
  }, [dispatch, displayStage, displayMedia.shouldUnpublish]);

  useEffect(() => {
    if (displayStage.publishError || screenshareUnpublished) {
      stopScreenShare();
    }
  }, [screenshareUnpublished, displayStage, stopScreenShare]);

  /**
   * Enter and leave stage collaborate session
   */
  const handleLeaveStages = useCallback(() => {
    dispatch(updateStreamMode(STREAM_MODES.LOW_LATENCY));
    leaveStages();
  }, [dispatch]);

  const enterCollaborateSession = useCallback(
    async ({
      joinMuted = false,
      joinAsSpectator = false,
      userStreamToPublish = userMediaStream
    } = {}) => {
      if (!userStage) return;

      if (joinMuted) {
        toggleLocalStreamAudio({ muted: true });
      }

      try {
        joinAsSpectator
          ? await userStage.join()
          : await userStage.join(userStreamToPublish);
        await displayStage.join();

        dispatch(updateStreamMode(STREAM_MODES.REAL_TIME));

        if (joinAsSpectator) {
          stopDevices();
        }
      } catch (error) {
        console.error(error);
        dispatch(
          updateCollaborateStates({
            isLeaving: true,
            leftReason: STAGE_LEFT_REASONS.FAILED_TO_JOIN
          })
        );
      }
      if (joinAsSpectator) {
        isEnterLockedRef.current = false;
      }
    },
    [
      dispatch,
      displayStage,
      stopDevices,
      toggleLocalStreamAudio,
      userMediaStream,
      userStage
    ]
  );

  useEffect(() => {
    if (
      !isEnterLockedRef.current &&
      stageLeftReason !== STAGE_LEFT_REASONS.STAGE_DELETED &&
      userConnectState === 'disconnected' &&
      typeof joinUserStage === 'function' &&
      typeof startUserMedia === 'function'
    ) {
      isEnterLockedRef.current = true;

      if (participantType === PARTICIPANT_TYPES.HOST) {
        (async function () {
          const userStreamToPublish = await startUserMedia();

          enterCollaborateSession({ userStreamToPublish });
        })();
      } else if (participantType === PARTICIPANT_TYPES.SPECTATOR) {
        enterCollaborateSession({
          joinMuted: true,
          joinAsSpectator: true
        });
      }
    }
  }, [
    enterCollaborateSession,
    startUserMedia,
    userConnectState,
    joinUserStage,
    participantType,
    stageLeftReason,
    isJoiningStage
  ]);

  /**
   * Start grace period to delete stage if idle
   */
  const beforeUnloadHandler = useCallback(() => {
    if (participantType === PARTICIPANT_TYPES.HOST) {
      queueMicrotask(() => {
        const body = {
          hostChannelId:
            publishingLocalParticipant?.attributes?.channelId ||
            userData?.channelId,
          stageId
        };

        navigator.sendBeacon(
          `${apiBaseUrl}/stages/sendHostDisconnectedMessage`,
          JSON.stringify(body)
        );
      });
    }

    if (participantType === PARTICIPANT_TYPES.SPECTATOR) {
      destroyStages();
    }
  }, [
    participantType,
    publishingLocalParticipant?.attributes?.channelId,
    stageId,
    userData?.channelId
  ]);

  useEffect(() => {
    window.addEventListener('beforeunload', beforeUnloadHandler);

    return () => {
      window.removeEventListener('beforeunload', beforeUnloadHandler);
    };
  }, [beforeUnloadHandler]);

  /**
   * Stage Controls
   */
  const stageControlsStates = useMemo(
    () => ({
      shouldRenderInviteLinkButton: [
        PARTICIPANT_TYPES.HOST,
        PARTICIPANT_TYPES.INVITED
      ].includes(publishingLocalParticipant?.attributes.type),
      shouldRenderShareScreenButton: [
        PARTICIPANT_TYPES.HOST,
        PARTICIPANT_TYPES.INVITED
      ].includes(publishingLocalParticipant?.attributes.type)
    }),
    [publishingLocalParticipant?.attributes.type]
  );

  const copyInviteUrl = useCallback(() => {
    if (inviteUrl) {
      copyToClipboard(inviteUrl);
      dispatch(
        updateSuccess(
          $contentNotification.success.session_link_has_been_copied_to_clipboard
        )
      );
    } else {
      console.error('The invite URL is not available');
      dispatch(updateError($contentNotification.error.unable_to_copy_link));
    }
  }, [dispatch, inviteUrl]);

  const leaveStage = useCallback(
    async ({ isLeavingStreamManager = false } = {}) => {
      let result, error;
      updateActiveDevice('video', null);
      updateActiveDevice('audio', null);

      if (participantType === PARTICIPANT_TYPES.HOST) {
        ({ result, error } = await stagesAPI.endStage());

        if (result) {
          isLeavingStreamManagerRef.current = isLeavingStreamManager;

          dispatch(
            updateGoLiveContainerStates({
              animateGoLiveButtonChevronIcon: false,
              delayAnimation: false
            })
          );

          if (displayMedia.isScreenSharing) stopScreenShare();

          dispatch(updateCollaborateStates({ isLeaving: true }));
        }
        if (error) {
          console.error(error);
          dispatch(
            updateError($contentNotification.error.unable_to_leave_session)
          );
        }
      } else {
        result = true;
        isLeavingStreamManagerRef.current = isLeavingStreamManager;

        dispatch(updateCollaborateStates({ isLeaving: true }));
      }

      return { result, error };
    },
    [
      updateActiveDevice,
      participantType,
      dispatch,
      displayMedia.isScreenSharing,
      stopScreenShare
    ]
  );

  /**
   * Navigate to the '/manager' route when the shared collaborate state "isLeaving" becomes true.
   * The "isLeaving" state is set to true under these conditions:
   * 1. When a host successfully deletes the stage they own.
   * 2. When a non-host participant triggers the "leaveStage" function.
   * 3. When the STAGE_LEFT event is received
   * 4. When user fails to join stage in "enterCollaborateSession"
   * This navigation ensures users are redirected after leaving a collaboration session.
   */
  useEffect(() => {
    if (isLeavingStage) {
      handleLeaveStages();
      if (
        !isLeavingStreamManagerRef.current &&
        pathname === COLLABORATE_ROUTE_PATH
      ) {
        navigate('/manager');
      }
      closeModal({ shouldCancel: false, shouldRefocus: false });
      stopDevices();
      dispatch(finalizeCollaborationExit(stageLeftReason));
      isLeavingStreamManagerRef.current = false;
    }
  }, [
    stopDevices,
    closeModal,
    dispatch,
    handleLeaveStages,
    isLeavingStage,
    navigate,
    pathname,
    stageLeftReason
  ]);

  /**
   * As an invited or requested participant,
   * If the host leaves the collaborate session then leave stage
   */
  useEffect(() => {
    if (
      [
        PARTICIPANT_TYPES.INVITED,
        PARTICIPANT_TYPES.REQUESTED,
        PARTICIPANT_TYPES.SPECTATOR
      ].includes(participantType) &&
      host.username &&
      !isJoiningStage
    ) {
      if (host.status === COLLABORATE_HOST_STATUS.DISCONNECTED) {
        setShouldFetchHostData(true);

        if (hostChannelData && !fetchHostChannelError) {
          const { stageId } = hostChannelData;

          if (!stageId) {
            dispatch(
              updateCollaborateStates({
                leftReason: STAGE_LEFT_REASONS.SESSION_ENDED
              })
            );
            leaveStage();
            setShouldFetchHostData(false);
          }
        }
      } else {
        // Host has connected, therefore stop fetching host channel data
        setShouldFetchHostData(false);
      }
    }
  }, [
    dispatch,
    fetchHostChannelError,
    host.status,
    host.username,
    hostChannelData,
    isJoiningStage,
    leaveStage,
    participantType,
    setShouldFetchHostData
  ]);

  const value = useMemo(
    () => ({
      [PARTICIPANT_GROUP.USER]: {
        ...userStage,
        isConnected: userStage.connectState === CONNECTED,
        isConnecting: userStage.connectState === CONNECTING
      },
      [PARTICIPANT_GROUP.DISPLAY]: displayStage,
      stageControls: {
        ...stageControlsStates,
        toggleAudio: toggleLocalStreamAudio,
        toggleVideo: toggleLocalStreamVideo,
        enterCollaborateSession,
        copyInviteUrl,
        leaveStage
      }
    }),
    [
      userStage,
      displayStage,
      stageControlsStates,
      toggleLocalStreamAudio,
      toggleLocalStreamVideo,
      enterCollaborateSession,
      copyInviteUrl,
      leaveStage
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

StageManagerProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export { StageManagerProvider, useStageManager };
