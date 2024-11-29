import { useCallback } from 'react';

import { getParticipationToken } from '../../../api/stages';
import { JOIN_PARTICIPANT_URL_PARAM_KEY } from '../../../helpers/stagesHelpers';
import { streamManager as $streamManagerContent } from '../../../content';
import { useBroadcast } from '../../../contexts/Broadcast';
import { useGlobalStage } from '../../../contexts/Stage';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PARTICIPANT_TYPES } from '../../../contexts/Stage/Global/reducer/globalReducer';
import { useStreams } from '../../../contexts/Streams';

const $contentNotification =
  $streamManagerContent.stream_manager_stage.notifications;

const useInviteParticipants = ({
  createStageInstanceAndJoin,
  updateError,
  shouldGetHostRejoinTokenRef,
  handleCloseJoinModal
}) => {
  const navigate = useNavigate();
  const {
    stageId,
    updateIsJoiningStageByInvite,
    creatingStage,
    updateStageId
  } = useGlobalStage();
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
      }

      if (error) {
        updateError({
          message: $contentNotification.error.unable_to_join_session,
          err: error
        });
        handleCloseJoinModal();
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
    updateStageId,
    handleCloseJoinModal
  ]);

  return { handleParticipantInvite };
};

export default useInviteParticipants;
