import { useMemo, useState } from 'react';
import Strategy from '../Strategy';
import { stagesAPI } from '../../api';
import useParticipants from './useParticipants';

const { Stage, StageEvents, StageParticipantSubscribeState } =
  window.IVSBroadcastClient;

const useStage = (stageConfig = undefined) => {
  const { participantEventHandlers } = useParticipants();

  const getStageConfig = async () => {
    const { result } = await stagesAPI.createStage();
    const { token = null, stageId = null } = result;

    return { token, stageId };
  };

  const [instance] = useState(async function createInstance() {
    const { token } = stageConfig ?? (await getStageConfig());
    const strategy = new Strategy();
    const stage = token ? new Stage(token, strategy.def) : null;
    const strategyMutators = strategy.mutators(stage);

    if (stage) {
      stage.on(
        StageEvents.STAGE_CONNECTION_STATE_CHANGED,
        participantEventHandlers.handleParticipantConnectionChangedEvent
      );
      stage.on(
        StageEvents.STAGE_PARTICIPANT_JOINED,
        participantEventHandlers.handleParticipantJoinEvent
      );
      stage.on(
        StageEvents.STAGE_PARTICIPANT_LEFT,
        participantEventHandlers.handleParticipantLeftEvent
      );
      stage.on(
        StageEvents.STAGE_PARTICIPANT_STREAMS_ADDED,
        participantEventHandlers.handlePartipantStreamsAddedEvent
      );
      stage.on(
        StageEvents.STAGE_STREAM_MUTE_CHANGED,
        participantEventHandlers.handleStreamMuteChangeEvent
      );
      stage.on(
        StageEvents.STAGE_PARTICIPANT_PUBLISH_STATE_CHANGED,
        participantEventHandlers.handleParticipantPublishStateChangedEvent
      );
      stage.on(
        StageEvents.STAGE_PARTICIPANT_SUBSCRIBE_STATE_CHANGED,
        (_, state) => {
          if (state === StageParticipantSubscribeState.ERRORED) {
            stage.refreshStrategy(strategy);
          }
        }
      );
    }

    return { stage, ...strategyMutators };
  });

  const value = useMemo(() => ({ instance }), [instance]);

  return value;
};

export default useStage;
