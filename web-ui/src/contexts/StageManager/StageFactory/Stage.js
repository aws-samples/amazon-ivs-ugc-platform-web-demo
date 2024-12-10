import { queueMacrotask } from '../utils';

import StageStrategy from './StageStrategy';
import { CUSTOM_STAGE_EVENTS } from '../constants';

const {
  Stage,
  StageConnectionState,
  StageErrorCategory,
  StageEvents,
  StageParticipantPublishState,
  SubscribeType
} = window.IVSBroadcastClient;
const {
  STAGE_LEFT,
  ERROR: STAGE_ERROR,
  STAGE_CONNECTION_STATE_CHANGED,
  STAGE_PARTICIPANT_PUBLISH_STATE_CHANGED
} = StageEvents;
const { STAGE_PARTICIPANT_SHOULD_UNPUBLISH } = CUSTOM_STAGE_EVENTS;
const { PUBLISH_ERROR } = StageErrorCategory;
const { PUBLISHED } = StageParticipantPublishState;
const { CONNECTED } = StageConnectionState;

class CustomStage extends Stage {
  strategyMutators;

  participantGroup;

  localParticipantId;

  connected = false; // Indicates whether the participant is currently connected

  published = false; // Indicates whether the participant has ever published this session

  constructor(stageConfig) {
    const strategy = new StageStrategy(stageConfig?.participantGroup);
    super(stageConfig?.token, strategy);

    this.strategyMutators = strategy.mutators(this);
    this.participantGroup = stageConfig.participantGroup;
    this.localParticipantId = stageConfig.participantId;

    /**
     * Ensure we leave the Stage when the window, the document and its resources are about to be unloaded,
     * i.e., when the user refreshes the page, closes the tab or closes the browser window.
     */
    const onBeforeUnload = () => queueMacrotask(this.leave);
    window.addEventListener('online', this.refreshStrategy, true);
    window.addEventListener('beforeunload', onBeforeUnload, true);

    this.on(STAGE_LEFT, (reason) => {
      console.warn(`Stage left (${this.participantGroup})`, reason);

      this.stageLeft = true;
      this.connected = false;
      this.published = false;

      window.removeEventListener('online', this.refreshStrategy);
      window.removeEventListener('beforeunload', onBeforeUnload);
    });

    this.on(STAGE_ERROR, (error) => {
      console.error(`Stage error (${this.participantGroup})`, error.toString());
      if (!this.published && error.category === PUBLISH_ERROR) {
        this.strategyMutators.unpublish(); // Unpublish to reset shouldPublish
      }
    });

    this.on(STAGE_CONNECTION_STATE_CHANGED, (state) => {
      this.connected = state === CONNECTED;
    });

    this.on(STAGE_PARTICIPANT_PUBLISH_STATE_CHANGED, (_, state) => {
      this.published = this.published || state === PUBLISHED;
    });

    this.on(STAGE_PARTICIPANT_SHOULD_UNPUBLISH, () => {
      this.strategyMutators.unpublish();
    });
  }

  set audioOnly(enabled) {
    this.strategyMutators.setSubscribeType(
      enabled ? SubscribeType.AUDIO_ONLY : SubscribeType.AUDIO_VIDEO
    );
  }

  on = super.on.bind(this);

  off = super.off.bind(this);

  emit = super.emit.bind(this);

  join = async (mediaStreamToPublish) => {
    await super.join();

    if (mediaStreamToPublish) {
      this.strategyMutators.publish(mediaStreamToPublish);
    }
  };
}

export default CustomStage;
