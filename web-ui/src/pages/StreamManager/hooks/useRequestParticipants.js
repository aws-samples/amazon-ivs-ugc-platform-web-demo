import { useCallback } from 'react';
import { streamManager as $streamManagerContent } from '../../../content';
import { useGlobalStage } from '../../../contexts/Stage';
import { useChannel } from '../../../contexts/Channel';
import { useLocation, useNavigate } from 'react-router-dom';
import { useBroadcast } from '../../../contexts/Broadcast';
import { useStreams } from '../../../contexts/Streams';
import { getParticipationToken } from '../../../api/stages';
import { PARTICIPANT_TYPES } from '../../../contexts/Stage/Global/reducer/globalReducer';
import { useModal } from '../../../contexts/Modal';
import { updateError } from '../../../contexts/Stage/Global/reducer/actions';
import { useUser } from '../../../contexts/User';
import { stagesAPI } from '../../../api';

const $contentNotification =
  $streamManagerContent.stream_manager_stage.notifications;

const useRequestParticipants = ({ createStageInstanceAndJoin }) => {
  const {
    isStageActive,
    creatingStage,
    updateIsJoiningStageByRequest,
    updateSpectatorParticipantId
  } = useGlobalStage();
  const navigate = useNavigate();
  const { closeModal } = useModal();
  const { channelData } = useChannel();
  const { userData } = useUser();
  const { state } = useLocation();
  const { isBroadcasting, removeBroadcastClient } = useBroadcast();
  const { isLive } = useStreams();

  const joinStageByRequest = useCallback(async () => {
    if (isStageActive || !channelData || !userData) return;

    const stageId = state?.stageId;
    const participantId = state?.participantId;

    if (isLive === undefined || isBroadcasting === undefined) return;

    if (isLive || isBroadcasting) {
      updateError({
        message: $contentNotification.error.unable_to_join_session
      });
      navigate('/manager', { state: {} });
    } else {
      creatingStage(true);

      // Remove requestee
      const { result: disconnectSpectatorResponse, error } =
        await stagesAPI.disconnectSpectator({
          participantId,
          participantChannelId: userData.channelId,
          stageId
        });

      if (disconnectSpectatorResponse) {
        updateSpectatorParticipantId(null);

        const { result, error } = await getParticipationToken(
          stageId,
          PARTICIPANT_TYPES.REQUESTED
        );

        creatingStage(false);

        if (result?.token) {
          removeBroadcastClient();
          await createStageInstanceAndJoin(result.token, stageId);
          updateIsJoiningStageByRequest(false);
          closeModal();
        }

        if (error) {
          updateError({
            message: $contentNotification.error.unable_to_join_session
          });
        }
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
    state?.participantId,
    isLive,
    isBroadcasting,
    navigate,
    creatingStage,
    updateSpectatorParticipantId,
    removeBroadcastClient,
    createStageInstanceAndJoin,
    updateIsJoiningStageByRequest,
    closeModal
  ]);

  return {
    joinStageByRequest
  };
};

export default useRequestParticipants;
