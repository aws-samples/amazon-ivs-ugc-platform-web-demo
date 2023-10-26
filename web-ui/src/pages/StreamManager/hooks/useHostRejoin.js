import { useCallback } from 'react';

import { getParticipationToken } from '../../../api/stages';
import { PARTICIPANT_TYPES } from '../../../contexts/Stage/Global/reducer/globalReducer';
import { streamManager as $streamManagerContent } from '../../../content';
import { useBroadcast } from '../../../contexts/Broadcast';
import { useChannel } from '../../../contexts/Channel';
import { useGlobalStage, useStreamManagerStage } from '../../../contexts/Stage';
import { useResponsiveDevice } from '../../../contexts/ResponsiveDevice';

const $contentNotification =
  $streamManagerContent.stream_manager_stage.notifications;

const useHostRejoin = () => {
  const { channelData } = useChannel();
  const { stageId: channelTableStageId = undefined } = channelData || {};
  const { creatingStage } = useGlobalStage();
  const { isDesktopView } = useResponsiveDevice();
  const { createStageInstanceAndJoin, updateError } = useStreamManagerStage();
  const { removeBroadcastClient, restartBroadcastClient } = useBroadcast();

  const handleHostRejoin = useCallback(
    async (openFullscreenView) => {
      // Remove broadcast client
      removeBroadcastClient();
      // Show spinner
      creatingStage(true);

      // Generate and fetch token for the host to join
      const { result, error } = await getParticipationToken(
        channelTableStageId,
        PARTICIPANT_TYPES.HOST
      );

      creatingStage(false);

      if (result?.token) {
        await createStageInstanceAndJoin(result.token, channelTableStageId);
        // open fullscreen view
        if (isDesktopView) {
          openFullscreenView();
        }
      }

      if (error) {
        restartBroadcastClient();
        updateError({
          message: $contentNotification.error.unable_to_join_session,
          err: error
        });
      }
    },
    [
      channelTableStageId,
      createStageInstanceAndJoin,
      creatingStage,
      isDesktopView,
      updateError,
      removeBroadcastClient,
      restartBroadcastClient
    ]
  );

  return { handleHostRejoin };
};

export default useHostRejoin;
