import { stagesAPI } from '../../../api';
import { STAGE_PUBLISHING_CAPACITY } from '../constants';

import Stage from './Stage';

const { StageEvents } = window.IVSBroadcastClient;

class StageFactory {
  static stages = new Map();

  static publishers = new Set();

  static create(stageConfig) {
    let stage = StageFactory.stages.get(stageConfig?.participantId);
    if (!stage) {
      stage = new Stage(stageConfig);
      stage.on(
        StageEvents.STAGE_PARTICIPANT_JOINED,
        StageFactory.updatePublishers
      );
      stage.on(
        StageEvents.STAGE_PARTICIPANT_LEFT,
        StageFactory.removePublisher
      );
      stage.on(
        StageEvents.STAGE_PARTICIPANT_PUBLISH_STATE_CHANGED,
        StageFactory.updatePublishers
      );
      StageFactory.stages.set(stageConfig.participantId, stage);
      // Attach the stages to the window for debugging purposes
      Object.assign(window, { stages: StageFactory.stages });
    }
    return stage;
  }

  static get hasPublishCapacity() {
    return StageFactory.publishers.size < STAGE_PUBLISHING_CAPACITY;
  }

  static addPublisher(participant) {
    StageFactory.publishers.add(participant.id);
  }

  static removePublisher(participant) {
    StageFactory.publishers.delete(participant.id);
  }

  static updatePublishers(participant) {
    if (participant.isPublishing) {
      StageFactory.addPublisher(participant);
    } else {
      StageFactory.removePublisher(participant);
    }
  }

  static async destroyStage(stage) {
    stage.leave();
    stage.removeAllListeners();
    StageFactory.stages.delete(stage.localParticipantId);

    if (!StageFactory.stages.size) {
      StageFactory.publishers.clear();
      delete window.stages; // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    // Use the stage token to identify if the user is the host and then call the "endStage" API
    if (stage?.token?.userID?.includes('host:')) {
      await stagesAPI.endStage();
    }
  }

  static destroyStages() {
    StageFactory.stages.forEach(StageFactory.destroyStage);
  }

  static leaveStages() {
    StageFactory.stages.forEach((stage) => stage.leave());
  }
}

export default StageFactory;
