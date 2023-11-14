import { useEffect, useRef, useCallback } from 'react';

import { getParticipationToken } from '../../../api/stages';
import { JOIN_PARTICIPANT_URL_PARAM_KEY } from '../../../helpers/stagesHelpers';
import { streamManager as $streamManagerContent } from '../../../content';
import { useBroadcast } from '../../../contexts/Broadcast';
import { useGlobalStage } from '../../../contexts/Stage';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PARTICIPANT_TYPES } from '../../../contexts/Stage/Global/reducer/globalReducer';

const $contentNotification =
  $streamManagerContent.stream_manager_stage.notifications;

const useInviteParticipants = ({
  shouldGetParticipantTokenRef,
  createStageInstanceAndJoin,
  updateError,
  resetStage,
  broadcastDevicesStateObjRef,
  shouldGetHostRejoinTokenRef
}) => {
  const navigate = useNavigate();
  const {
    stageId,
    updateStageId,
    addParticipant,
    localParticipant,
    updateIsJoiningStageByInvite
  } = useGlobalStage();
  const { hasPermissions, removeBroadcastClient, restartBroadcastClient } =
    useBroadcast();

  const openFullscreenViewCallbackFunctionRef = useRef();
  const [searchParams] = useSearchParams();
  const stageIdUrlParam = searchParams.get(JOIN_PARTICIPANT_URL_PARAM_KEY);

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
        shouldGetParticipantTokenRef.current = true;
      }
    },
    [
      removeBroadcastClient,
      restartBroadcastClient,
      updateError,
      navigate,
      updateStageId,
      stageIdUrlParam,
      addParticipant,
      shouldGetParticipantTokenRef
    ]
  );

  useEffect(() => {
    if (shouldGetParticipantTokenRef.current && hasPermissions && stageId) {
      shouldGetParticipantTokenRef.current = false;
      (async function () {
        const { result, error } = await getParticipationToken(
          stageId,
          PARTICIPANT_TYPES.INVITED
        );
        if (result?.token) {
          await createStageInstanceAndJoin(result.token, stageId);
          shouldGetHostRejoinTokenRef.current = false;
          // open fullscreen view, RESET isJoinginStageInvite to false
          updateIsJoiningStageByInvite(false);
        }

        if (error) {
          resetStage();
          updateError({
            message: $contentNotification.error.unable_to_join_session,
            err: error
          });
          navigate('/manager');
          broadcastDevicesStateObjRef.current = {
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
    resetStage,
    broadcastDevicesStateObjRef,
    shouldGetParticipantTokenRef,
    shouldGetHostRejoinTokenRef,
    updateIsJoiningStageByInvite
  ]);

  return { handleParticipantInvite };
};

export default useInviteParticipants;
