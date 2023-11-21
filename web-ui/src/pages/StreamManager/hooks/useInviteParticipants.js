import { useCallback } from 'react';

import { getParticipationToken } from '../../../api/stages';
import { JOIN_PARTICIPANT_URL_PARAM_KEY } from '../../../helpers/stagesHelpers';
import { streamManager as $streamManagerContent } from '../../../content';
import { useBroadcast } from '../../../contexts/Broadcast';
import { useGlobalStage } from '../../../contexts/Stage';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PARTICIPANT_TYPES } from '../../../contexts/Stage/Global/reducer/globalReducer';
import { useStreams } from '../../../contexts/Streams';
import { useModal } from '../../../contexts/Modal';

const $contentNotification =
  $streamManagerContent.stream_manager_stage.notifications;

const useInviteParticipants = ({
  createStageInstanceAndJoin,
  updateError,
  resetStage,
  broadcastDevicesStateObjRef,
  shouldGetHostRejoinTokenRef
}) => {
  const navigate = useNavigate();
  const {
    stageId,
    localParticipant,
    updateIsJoiningStageByInvite,
    creatingStage,
    updateStageId
  } = useGlobalStage();
  const { closeModal } = useModal();
  const { removeBroadcastClient, isBroadcasting } = useBroadcast();
  const { isLive } = useStreams();

  const [searchParams] = useSearchParams();
  const stageIdUrlParam = searchParams.get(JOIN_PARTICIPANT_URL_PARAM_KEY);

  const handleParticipantInvite = useCallback(async () => {
    if (isLive === undefined || isBroadcasting === undefined) return;

    if (isLive || isBroadcasting) {
      updateError({
        message: $contentNotification.error.unable_to_join_session
      });
      navigate('/manager');
    } else {
      creatingStage(true);

      const { result, error } = await getParticipationToken(
        stageIdUrlParam,
        PARTICIPANT_TYPES.INVITED
      );

      creatingStage(false);

      if (result?.token) {
        removeBroadcastClient();
        await createStageInstanceAndJoin(result.token, stageId);
        updateStageId(stageIdUrlParam);
        updateIsJoiningStageByInvite(false);
        shouldGetHostRejoinTokenRef.current = false;
        closeModal();
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
    }
  }, [
    isLive,
    isBroadcasting,
    updateError,
    navigate,
    creatingStage,
    stageIdUrlParam,
    removeBroadcastClient,
    createStageInstanceAndJoin,
    stageId,
    updateIsJoiningStageByInvite,
    shouldGetHostRejoinTokenRef,
    closeModal,
    resetStage,
    broadcastDevicesStateObjRef,
    localParticipant?.isCameraHidden,
    localParticipant?.isMicrophoneMuted,
    updateStageId
  ]);

  return { handleParticipantInvite };
};

export default useInviteParticipants;
