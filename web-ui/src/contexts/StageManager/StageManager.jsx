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
  useBeforeUnload,
  useLoaderData,
  useLocation,
  useNavigate
} from 'react-router-dom';
import PropTypes from 'prop-types';
import copyToClipboard from 'copy-to-clipboard';

import { useLocalStorage, useMount } from './hooks';
import useContextHook from '../useContextHook';
import { PARTICIPANT_GROUP } from './constants';
import useStage from './useStage';
import { useDeviceManager } from '../DeviceManager';
import { useGlobal } from '../Stage/Global';
import StageFactory from './StageFactory';
import { PARTICIPANT_TYPES } from '../Stage/Global/reducer/globalReducer';
import { streamManager as $streamManagerContent } from '../../content';
import { retryWithExponentialBackoff } from '../../utils';
import { stagesAPI } from '../../api';
import { MODAL_TYPE, useModal } from '../Modal';
import {
  DISPLAY_STAGE_ID_URL_PARAM,
  USER_STAGE_ID_URL_PARAM,
  createUserJoinedSuccessMessage
} from '../../helpers/stagesHelpers';
import { useUser } from '../User';
import { apiBaseUrl } from '../../api/utils';

const {
  StageParticipantPublishState,
  StreamType,
  StageEvents,
  StageLeftReason
} = window.IVSBroadcastClient;
const { PUBLISHED } = StageParticipantPublishState;

const $contentNotification =
  $streamManagerContent.stream_manager_stage.notifications;

const { leaveStages, destroyStages } = StageFactory;

const Context = createContext(null);
Context.displayName = 'StageManager';

function useStageManager() {
  return useContextHook(Context, false);
}

function StageManagerProvider({ children }) {
  const asyncValue = useAsyncValue();
  const loaderData = useLoaderData();
  const {
    user: userConfig,
    display: displayConfig,
    participantRole
  } = asyncValue ?? loaderData;

  const navigate = useNavigate();
  const [audioOnly] = useLocalStorage('audioOnly');
  const [simulcast] = useLocalStorage('simulcast');
  const {
    updateSuccess,
    updateError,
    updateAnimateCollapseStageContainerWithDelay,
    updateShouldAnimateGoLiveButtonChevronIcon
  } = useGlobal();
  const userOptions = { audioOnly, simulcast };
  const url = new URL(window.location.href);
  const [inviteUrl] = useState(
    userConfig.stageId
      ? `${url.origin}/manager/collab?${USER_STAGE_ID_URL_PARAM}=${userConfig.stageId}&${DISPLAY_STAGE_ID_URL_PARAM}=${displayConfig.stageId}`
      : null
  );
  const isInvitedStageUser = participantRole === 'invited';
  const isRequestedStageUser = participantRole === 'requested';

  const userStage = useStage(userConfig, userOptions);
  const displayStage = useStage(displayConfig);

  const {
    userMedia: {
      toggleAudio,
      toggleVideo,
      updateActiveDevice,
      mediaStream: userMediaStream,
      shouldUpdateStreamsToPublish,
      setShouldUpdateStreamsToPublish,
      publishState,
      subscribeOnly,
      stopUserMedia,
      startUserMedia
    },
    displayMedia: {
      stopScreenShare,
      mediaStreamToPublish,
      setMediaStreamToPublish,
      shouldUnpublishScreenshare,
      setShouldUnpublishScreenshare,
      isScreenSharing
    },
    stopDevices
  } = useDeviceManager();

  const publishingLocalParticipant = userStage.getParticipants({
    isPublishing: true,
    canSubscribeTo: true,
    isLocal: true
  })[0];

  /**
   * Successfully joined notification
   */
  useEffect(() => {
    if (!publishingLocalParticipant || userStage.connectState !== 'connected')
      return;
    function onJoin(participant) {
      const {
        attributes: {
          username,
          participantGroup,
          participantTokenCreationDate
        },
        isLocal
      } = participant;
      const joinTokenCreatedDate = new Date(
        parseInt(participantTokenCreationDate, 10)
      );
      const localTokenCreatedUnix = parseInt(
        publishingLocalParticipant?.attributes.participantTokenCreationDate,
        10
      );
      const localTokenCreatedDate = isNaN(localTokenCreatedUnix)
        ? new Date()
        : new Date(localTokenCreatedUnix);

      if (!isLocal && joinTokenCreatedDate > localTokenCreatedDate) {
        const successMessage = createUserJoinedSuccessMessage(
          username,
          participantGroup
        );
        updateSuccess(successMessage);
      }
    }

    [userStage.on, displayStage.on].forEach((on) => {
      on(StageEvents.STAGE_PARTICIPANT_JOINED, onJoin);
    });
    return () => {
      [userStage.off, displayStage.off].forEach((off) => {
        off(StageEvents.STAGE_PARTICIPANT_JOINED, onJoin);
      });
    };
  }, [
    userStage,
    updateSuccess,
    displayStage.on,
    publishingLocalParticipant,
    displayStage.off
  ]);

  /**
   * User Media
   */
  const toggleLocalStreamAudio = useCallback(
    ({ muted }) => {
      // If available, the audio local stage stream should be the source of truth for the next muted state
      const isAudioLocalStageStreamMuted =
        userStage.toggleLocalStageStreamMutedState(StreamType.AUDIO, muted);

      toggleAudio({ muted: isAudioLocalStageStreamMuted });
    },
    [toggleAudio, userStage]
  );

  const toggleLocalStreamVideo = useCallback(
    ({ stopped }) => {
      // If available, the video local stage stream should be the source of truth for the next muted state
      const isVideoLocalStageStreamMuted =
        userStage.toggleLocalStageStreamMutedState(StreamType.VIDEO, stopped);
      toggleVideo({ stopped: isVideoLocalStageStreamMuted });
    },
    [toggleVideo, userStage]
  );

  useEffect(() => {
    // when the media stream is updated, should also update the stage streams to publish
    if (
      typeof userStage.updateStreamsToPublish === 'function' &&
      shouldUpdateStreamsToPublish
    ) {
      userStage.updateStreamsToPublish(userMediaStream);
      setShouldUpdateStreamsToPublish(false);
    }
  }, [
    userMediaStream,
    setShouldUpdateStreamsToPublish,
    shouldUpdateStreamsToPublish,
    userStage
  ]);

  const userPublishStateDeferred = useDeferredValue(publishState);
  const userUnpublished =
    subscribeOnly && userPublishStateDeferred === PUBLISHED;
  useEffect(() => {
    if (userUnpublished) {
      stopUserMedia();
    }
  }, [userUnpublished, stopUserMedia]);

  /**
   * Display Media
   */
  useEffect(() => {
    if (mediaStreamToPublish) {
      displayStage.publish(mediaStreamToPublish);
      setMediaStreamToPublish(null);
    }
  }, [displayStage, mediaStreamToPublish, setMediaStreamToPublish]);

  useEffect(() => {
    if (shouldUnpublishScreenshare) {
      displayStage.unpublish();
      setShouldUnpublishScreenshare(false);
    }
  }, [displayStage, shouldUnpublishScreenshare, setShouldUnpublishScreenshare]);

  const screensharePublishStateDeferred = useDeferredValue(publishState);
  const screenshareUnpublished =
    subscribeOnly && screensharePublishStateDeferred === PUBLISHED;
  useEffect(() => {
    if (displayStage.publishError || screenshareUnpublished) {
      stopScreenShare();
    }
  }, [screenshareUnpublished, displayStage, stopScreenShare]);

  /**
   * Enter and leave meeting (stage session)
   */
  const { closeModal } = useModal();
  const { pathname } = useLocation();
  const enterMeeting = useCallback(
    async ({
      joinMuted = false,
      joinAsViewer = false,
      userStreamToPublish = userMediaStream
    } = {}) => {
      if (!userStage) return;

      if (joinMuted) {
        toggleLocalStreamAudio({ muted: true });
      }

      try {
        joinAsViewer
          ? await userStage.join()
          : await userStage.join(userStreamToPublish);
        await displayStage.join();

        if (joinAsViewer) {
          stopDevices();
        }
      } catch (error) {
        updateError({
          message: $contentNotification.error.unable_to_join_session,
          err: error
        });
        leaveStages();
        if (participantRole !== 'spectator') {
          // Return back to default state on /manager route
          navigate('/manager');
          closeModal({ shouldCancel: false, shouldRefocus: false });
        }
      }
    },
    [
      stopDevices,
      toggleLocalStreamAudio,
      userMediaStream,
      userStage,
      displayStage,
      participantRole,
      navigate,
      closeModal,
      updateError
    ]
  );

  const isEnterLock = useRef(false);
  const isMounted = useMount();

  const { connectState: userConnectState, join: joinUserStage } = userStage;

  useEffect(() => {
    if (
      userStage.stageLeftReason !== StageLeftReason.STAGE_DELETED &&
      userConnectState === 'disconnected' &&
      typeof joinUserStage === 'function' &&
      typeof startUserMedia === 'function'
    ) {
      if (!isEnterLock.current && participantRole === 'host') {
        isEnterLock.current = true;
        (async function () {
          const userStreamToPublish = await startUserMedia();

          enterMeeting({ userStreamToPublish });
        })();
      }

      if (participantRole === 'spectator') {
        enterMeeting({
          joinMuted: true,
          joinAsViewer: true
        });
      }
    }
  }, [
    enterMeeting,
    startUserMedia,
    userConnectState,
    joinUserStage,
    participantRole,
    userStage.stageLeftReason
  ]);

  useEffect(() => {
    return () => {
      // Leave stages on unmount
      if (!isMounted()) {
        leaveStages();
      }
    };
  }, [isMounted, participantRole]);

  const isUserStageDeleted =
    userStage?.stageLeftReason === StageLeftReason.STAGE_DELETED;
  const isUserDisconnected =
    userStage?.stageLeftReason === StageLeftReason.PARTICIPANT_DISCONNECTED;
  useEffect(() => {
    // Navigate to /manager route when stage resource is deleted on stream manager page
    if (isUserStageDeleted || isUserDisconnected) {
      updateError({
        message: $contentNotification.error.you_have_been_removed_from_session
      });
      navigate(participantRole === 'spectator' ? pathname : '/manager');
    }
  }, [
    isUserDisconnected,
    isUserStageDeleted,
    navigate,
    participantRole,
    pathname,
    updateError
  ]);

  useBeforeUnload(
    useCallback(() => {
      if (participantRole === 'spectator') destroyStages();
    }, [participantRole])
  );

  /**
   * Start grace period to delete stage if idle
   */
  const { userData } = useUser();
  useEffect(() => {
    const beforeUnloadHandler = () => {
      if (userStage || displayStage) {
        queueMicrotask(() => {
          setTimeout(() => {
            if (participantRole === 'host') {
              const body = {
                hostChannelId:
                  publishingLocalParticipant?.attributes?.channelId ||
                  userData?.channelId
              };
              navigator.sendBeacon(
                `${apiBaseUrl}/stages/sendHostDisconnectedMessage`,
                JSON.stringify(body)
              );
            }
          }, 0);
        });
      }
    };

    window.addEventListener('beforeunload', beforeUnloadHandler);

    return () => {
      window.removeEventListener('beforeunload', beforeUnloadHandler);
    };
  }, [
    userStage,
    displayStage,
    userData?.channelId,
    participantRole,
    publishingLocalParticipant?.attributes?.channelId
  ]);

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
      updateSuccess(
        $contentNotification.success.session_link_has_been_copied_to_clipboard
      );
    }
  }, [inviteUrl, updateSuccess]);

  const leaveStage = useCallback(async () => {
    destroyStages();
    updateActiveDevice('video', null);
    updateActiveDevice('audio', null);

    if (participantRole === 'host') {
      const { result, error } = await retryWithExponentialBackoff({
        promiseFn: () => stagesAPI.deleteStage(),
        maxRetries: 2
      });

      if (result) {
        updateAnimateCollapseStageContainerWithDelay(false);
        updateShouldAnimateGoLiveButtonChevronIcon(false);

        if (isScreenSharing) stopScreenShare();
        updateSuccess($contentNotification.success.you_have_left_the_session);
      }
      if (error) {
        updateError({
          message: $contentNotification.error.unable_to_leave_session,
          err: error
        });
      }
    }
    navigate('/manager');
  }, [
    updateActiveDevice,
    participantRole,
    navigate,
    updateAnimateCollapseStageContainerWithDelay,
    updateShouldAnimateGoLiveButtonChevronIcon,
    isScreenSharing,
    stopScreenShare,
    updateSuccess,
    updateError
  ]);

  /**
   * Stage join modal
   */

  const { openModal } = useModal();

  const handleCloseJoinModal = useCallback(() => {
    setTimeout(() => {
      window.history.replaceState({}, document.title);
      window.location.href = '/manager';
    }, 100);
  }, []);

  const handleOpenJoinModal = useCallback(() => {
    openModal({
      type: MODAL_TYPE.STAGE_JOIN,
      onCancel: handleCloseJoinModal
    });
  }, [openModal, handleCloseJoinModal]);

  const value = useMemo(
    () => ({
      [PARTICIPANT_GROUP.USER]: {
        ...userStage,
        isUserStageConnected: userStage.connectState === 'connected'
      },
      [PARTICIPANT_GROUP.DISPLAY]: displayStage,
      stageControls: {
        ...stageControlsStates,
        toggleAudio: toggleLocalStreamAudio,
        toggleVideo: toggleLocalStreamVideo,
        enterMeeting,
        copyInviteUrl,
        leaveStage,
        handleOpenJoinModal
      },
      participantRole,
      isJoiningStageByRequestOrInvite:
        (isInvitedStageUser || isRequestedStageUser) &&
        userStage.connectState === 'disconnected'
    }),
    [
      userStage,
      displayStage,
      stageControlsStates,
      toggleLocalStreamAudio,
      toggleLocalStreamVideo,
      enterMeeting,
      copyInviteUrl,
      leaveStage,
      handleOpenJoinModal,
      participantRole,
      isInvitedStageUser,
      isRequestedStageUser
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

StageManagerProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export { StageManagerProvider, useStageManager };
