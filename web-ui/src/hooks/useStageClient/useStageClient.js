import { useCallback, useRef, useState, useEffect } from 'react';

import useStageEventHandlers from './useStageEventHandlers';
import { apiBaseUrl } from '../../api/utils';
import { noop } from '../../utils';
import { useGlobalStage } from '../../contexts/Stage';

const { Stage } = window.IVSBroadcastClient;

const useStageClient = (
  { updateSuccess, stageConnectionErroredEventCallback } = {
    updateSuccess: noop,
    stageConnectionErroredEventCallback: noop
  }
) => {
  const clientRef = useRef();
  const [isClientDefined, setIsClientDefined] = useState(false);
  const { resetParticipants, strategy, resetStageState, isHost } =
    useGlobalStage();
  const { attachStageEvents } = useStageEventHandlers({
    client: clientRef.current,
    updateSuccess,
    stageConnectionErroredEventCallback
  });

  const joinStageClient = useCallback(
    async ({ token, strategy }) => {
      clientRef.current = new Stage(token, strategy);
      setIsClientDefined(!!clientRef.current);
      attachStageEvents(clientRef.current);

      await clientRef.current.join();
    },
    [attachStageEvents]
  );

  const leaveStageClient = useCallback(() => {
    strategy.stopTracks();

    if (clientRef.current) {
      clientRef.current.removeAllListeners();
      clientRef.current.leave();
      clientRef.current = undefined;
    }
  }, [strategy]);

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
              navigator.sendBeacon(`${apiBaseUrl}/stages/disconnect`);
            }

            clientRef.current.leave();
          }, 0)
        );
      });
    }
  }, [isClientDefined, isHost]);

  return {
    client: clientRef.current,
    strategy,
    resetAllStageState,
    leaveStageClient,
    joinStageClient
  };
};

export default useStageClient;
