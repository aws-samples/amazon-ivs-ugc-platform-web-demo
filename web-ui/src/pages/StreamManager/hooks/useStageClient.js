import { useCallback, useRef, useState, useEffect } from 'react';

import useStageEventHandlers from './useStageEventHandlers';
import { useGlobalStage } from '../../../contexts/Stage';
import { apiBaseUrl, sendBeaconRequest } from '../../../api/utils';

const { Stage } = window.IVSBroadcastClient;

const useStageClient = ({ updateSuccess, updateError }) => {
  const clientRef = useRef();
  const [isClientDefined, setIsClientDefined] = useState(false);
  const { resetParticipants, strategy, resetStageState } = useGlobalStage();
  const { attachStageEvents } = useStageEventHandlers({
    client: clientRef.current,
    updateSuccess,
    updateError
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
    ({ omit }) => {
      resetStageState({ omit });
      resetParticipants();
    },
    [resetStageState, resetParticipants]
  );

  useEffect(() => {
    if (isClientDefined && clientRef.current) {
      window.addEventListener('beforeunload', () => {
        try {
          sendBeaconRequest(`${apiBaseUrl}/stages/disconnect`, true)
        } catch (e) {
          // Fail silently...
        }

        queueMicrotask(setTimeout(() => clientRef.current.leave(), 0));
      });
    }
  }, [isClientDefined]);

  return {
    client: clientRef.current,
    strategy,
    resetAllStageState,
    leaveStageClient,
    joinStageClient
  };
};

export default useStageClient;
