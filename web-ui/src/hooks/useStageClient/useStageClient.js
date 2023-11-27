import { useCallback, useRef, useState, useEffect } from 'react';

import useStageEventHandlers from './useStageEventHandlers';
import { apiBaseUrl } from '../../api/utils';
import { noop } from '../../utils';
import { useGlobalStage } from '../../contexts/Stage';
import { useUser } from '../../contexts/User';

const { Stage } = window.IVSBroadcastClient;

const useStageClient = (
  { updateSuccess, stageConnectionErroredEventCallback } = {
    updateSuccess: noop,
    stageConnectionErroredEventCallback: noop
  }
) => {
  const clientRef = useRef();
  const [isClientDefined, setIsClientDefined] = useState(false);
  const {
    resetParticipants,
    strategy,
    resetStageState,
    isHost,
    localParticipant
  } = useGlobalStage();
  const { attachStageEvents } = useStageEventHandlers({
    client: clientRef.current,
    updateSuccess,
    stageConnectionErroredEventCallback
  });
  const { userData } = useUser();

  const joinStageClient = useCallback(
    async ({ token, strategy, shouldattachEvents = true }) => {
      clientRef.current = new Stage(token, strategy);
      setIsClientDefined(!!clientRef.current);
      if (shouldattachEvents) attachStageEvents(clientRef.current);

      await clientRef.current.join();
    },
    [attachStageEvents]
  );

  const leaveStageClient = useCallback(
    (
      { shouldUpdateStrategy, shouldRemoveAllEventListeners } = {
        shouldUpdateStrategy: true,
        shouldRemoveAllEventListeners: true
      }
    ) => {
      if (shouldUpdateStrategy) strategy.stopTracks();

      if (clientRef.current) {
        if (shouldRemoveAllEventListeners)
          clientRef.current.removeAllListeners();
        clientRef.current.leave();
        clientRef.current = undefined;
      }
    },
    [strategy]
  );

  const resetAllStageState = useCallback(
    ({ omit } = {}) => {
      resetStageState({ omit });
      resetParticipants();
    },
    [resetStageState, resetParticipants]
  );

  useEffect(() => {
    if (isClientDefined && clientRef.current) {
      window.addEventListener('beforeunload', () => {
        queueMicrotask(
          setTimeout(() => {
            if (isHost) {
              const body = {
                hostChannelId:
                  localParticipant?.attributes?.channelId || userData?.channelId
              };
              // Triggered on Firefox
              navigator.sendBeacon(
                `${apiBaseUrl}/stages/sendHostDisconnectedMessage`,
                JSON.stringify(body)
              );
            }

            clientRef.current.leave();
          }, 0)
        );
      });
    }
  }, [isClientDefined, isHost, localParticipant, userData?.channelId]);

  return {
    client: clientRef.current,
    strategy,
    resetAllStageState,
    leaveStageClient,
    joinStageClient
  };
};

export default useStageClient;
