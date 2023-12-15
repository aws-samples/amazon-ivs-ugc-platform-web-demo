import { useCallback } from 'react';

import { getParticipationToken } from '../../../api/stages';
import { PARTICIPANT_TYPES } from '../../../contexts/Stage/Global/reducer/globalReducer';
import { streamManager as $streamManagerContent } from '../../../content';
import { useChannel } from '../../../contexts/Channel';
import { useGlobalStage, useStreamManagerStage } from '../../../contexts/Stage';
import { useBroadcast } from '../../../contexts/Broadcast';

const $contentNotification =
  $streamManagerContent.stream_manager_stage.notifications;

const useHostRejoin = () => {
  const { channelData } = useChannel();
  const { stageId: channelTableStageId = undefined } = channelData || {};
  const { creatingStage, localParticipant } = useGlobalStage();
  const {
    createStageInstanceAndJoin,
    updateError,
    broadcastDevicesStateObjRef
  } = useStreamManagerStage();
  const { removeBroadcastClient } = useBroadcast();

  const handleHostRejoin = useCallback(
    async (openFullscreenView) => {
      creatingStage(true);

      // Generate and fetch token for the host to join
      const { result, error } = await getParticipationToken(
        channelTableStageId,
        PARTICIPANT_TYPES.HOST
      );

      creatingStage(false);

      if (result?.token) {
        removeBroadcastClient();
        await createStageInstanceAndJoin(result.token, channelTableStageId);
        openFullscreenView();
      }

      if (error) {
        updateError({
          message: $contentNotification.error.unable_to_join_session,
          err: error
        });
        broadcastDevicesStateObjRef.current = {
          isCameraHidden: localParticipant?.isCameraHidden || false,
          isMicrophoneMuted: localParticipant?.isMicrophoneMuted || false
        };
      }
    },
    [
      creatingStage,
      channelTableStageId,
      createStageInstanceAndJoin,
      updateError,
      broadcastDevicesStateObjRef,
      localParticipant?.isCameraHidden,
      localParticipant?.isMicrophoneMuted,
      removeBroadcastClient
    ]
  );

  return { handleHostRejoin };
};

export default useHostRejoin;
