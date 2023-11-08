import { useCallback } from 'react';
import { useGlobalStage, useStreamManagerStage } from '../../../contexts/Stage';
import { useChannel } from '../../../contexts/Channel';
import { useLocation } from 'react-router-dom';
import { useBroadcast } from '../../../contexts/Broadcast';
import { useStreams } from '../../../contexts/Streams';
import { getParticipationToken } from '../../../api/stages';
import { PARTICIPANT_TYPES } from '../../../contexts/Stage/Global/reducer/globalReducer';
import { useModal } from '../../../contexts/Modal';

const useRequestParticipants = () => {
  const { isStageActive, createStageInstanceAndJoin } = useStreamManagerStage();
  const { updateIsJoiningStageByRequest } = useGlobalStage();
  const { closeModal } = useModal();
  const { channelData } = useChannel();
  const { state } = useLocation();
  const { isBroadcasting, removeBroadcastClient } = useBroadcast();
  const { isLive } = useStreams();

  const joinStageByRequest = useCallback(async () => {
    if (!isStageActive && channelData) {
      const stageId = state?.stageId;

      if (isLive === undefined || isBroadcasting === undefined) return;

      const { result, error } = await getParticipationToken(
        stageId,
        PARTICIPANT_TYPES.REQUESTED
      );
      removeBroadcastClient();

      if (result?.token) {
        await createStageInstanceAndJoin(result.token, stageId);
        updateIsJoiningStageByRequest(false);
        closeModal();
      }

      if (error) {
        console.log('something happened');
      }
    }
  }, [
    channelData,
    closeModal,
    createStageInstanceAndJoin,
    isBroadcasting,
    isLive,
    isStageActive,
    removeBroadcastClient,
    state?.stageId,
    updateIsJoiningStageByRequest
  ]);

  return {
    joinStageByRequest
  };
};

export default useRequestParticipants;
