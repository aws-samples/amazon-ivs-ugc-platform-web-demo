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
    isHost,
    localParticipant,
    resetParticipants,
    resetStageState,
    strategy
  } = useGlobalStage();
  const { attachStageEvents } = useStageEventHandlers({
    client: clientRef?.current,
    updateSuccess,
    stageConnectionErroredEventCallback
  });
  const { userData } = useUser();

  const joinStageClient = useCallback(
    async ({ token, strategy, shouldAttachEvents = true }) => {
      clientRef.current = new Stage(token, strategy);
      setIsClientDefined(!!clientRef.current);
      if (shouldAttachEvents) attachStageEvents(clientRef.current);

      await clientRef.current.join();
    },
    [attachStageEvents]
  );

  const leaveStageClient = useCallback(
    (strategyParam = null) => {
      const _strategy = strategyParam ?? strategy;
      if (_strategy?.stopAndResetTracks) _strategy.stopAndResetTracks();

      if (clientRef.current) {
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
    const beforeUnloadHandler = () => {
      if (isClientDefined && clientRef?.current) {
        queueMicrotask(() => {
          setTimeout(() => {
            if (isHost) {
              const body = {
                hostChannelId:
                  localParticipant?.attributes?.channelId || userData?.channelId
              };
              navigator.sendBeacon(
                `${apiBaseUrl}/stages/sendHostDisconnectedMessage`,
                JSON.stringify(body)
              );
            }

            clientRef.current.leave();
          }, 0);
        });
      }
    };

    window.addEventListener('beforeunload', beforeUnloadHandler);

    return () => {
      window.removeEventListener('beforeunload', beforeUnloadHandler);
    };
  }, [isClientDefined, isHost, localParticipant, userData?.channelId]);

  return {
    client: clientRef?.current,
    strategy,
    resetAllStageState,
    leaveStageClient,
    joinStageClient
  };
};

export default useStageClient;
