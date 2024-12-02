import { useCallback } from 'react';
import { streamManager as $streamManagerContent } from '../../../content';
import { useGlobalStage } from '../../../contexts/Stage';
import { useChannel } from '../../../contexts/Channel';
import { useLocation, useNavigate } from 'react-router-dom';
import { useBroadcast } from '../../../contexts/Broadcast';
import { useStreams } from '../../../contexts/Streams';
import { getParticipationToken } from '../../../api/stages';
import { PARTICIPANT_TYPES } from '../../../contexts/Stage/Global/reducer/globalReducer';
import { updateError } from '../../../contexts/Stage/Global/reducer/actions';
import { useUser } from '../../../contexts/User';

const $contentNotification =
  $streamManagerContent.stream_manager_stage.notifications;

const useRequestParticipants = ({ createStageInstanceAndJoin }) => {
  const { isStageActive, creatingStage, updateIsJoiningStageByRequest } =
    useGlobalStage();
  const navigate = useNavigate();
  const { channelData } = useChannel();
  const { userData } = useUser();
  const { state } = useLocation();
  const { isBroadcasting, removeBroadcastClient } = useBroadcast();
  const { isLive } = useStreams();

  const joinStageByRequest = useCallback(async () => {
    if (isStageActive || !channelData || !userData) return;

    const stageId = state?.stageId;

    if (isLive === undefined || isBroadcasting === undefined) return;

    if (isLive || isBroadcasting) {
      updateError({
        message: $contentNotification.error.unable_to_join_session
      });
      navigate('/manager', { state: {} });
    } else {
      creatingStage(true);

      const { result, error } = await getParticipationToken(
        stageId,
        PARTICIPANT_TYPES.REQUESTED
      );

      creatingStage(false);

      if (result?.token) {
        removeBroadcastClient();
        await createStageInstanceAndJoin(result.token, stageId);
        updateIsJoiningStageByRequest(false);
      }

      if (error) {
        updateError({
          message: $contentNotification.error.unable_to_join_session
        });
      }
    }
  }, [
    isStageActive,
    channelData,
    userData,
    state?.stageId,
    isLive,
    isBroadcasting,
    navigate,
    creatingStage,
    removeBroadcastClient,
    createStageInstanceAndJoin,
    updateIsJoiningStageByRequest
  ]);

  return {
    joinStageByRequest
  };
};

export default useRequestParticipants;
