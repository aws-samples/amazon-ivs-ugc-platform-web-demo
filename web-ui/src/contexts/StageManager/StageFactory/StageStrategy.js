import { deepEqual } from 'fast-equals';

import { CUSTOM_STAGE_EVENTS } from '../constants';

const {
  LocalStageStream,
  StageErrorCategory,
  StageEvents,
  StageParticipantPublishState,
  SubscribeType
} = window.IVSBroadcastClient;

const { STAGE_PARTICIPANT_REPUBLISH_STATE_CHANGED } = CUSTOM_STAGE_EVENTS;
const { STAGE_PARTICIPANT_PUBLISH_STATE_CHANGED, ERROR: STAGE_ERROR } =
  StageEvents;

const STAGE_MAX_AUDIO_BITRATE_KBPS = 128;
const STAGE_MAX_BITRATE = 2500;
const STAGE_MAX_FRAMERATE = 30;

class StageStrategy {
  shouldPublish = false;

  mediaStreamToPublish;

  simulcast;

  subscribeType = SubscribeType.AUDIO_VIDEO;

  participantGroup;

  constructor(participantGroup) {
    this.participantGroup = participantGroup;
  }

  get subscribed() {
    return this.subscribeType !== SubscribeType.NONE;
  }

  /**
   * Stage Strategy
   */

  stageStreamsToPublish() {
    const streams = [];

    const audioTrack = this.mediaStreamToPublish?.getAudioTracks()[0];
    const audioConfig = {
      stereo: true,
      maxAudioBitrateKbps: STAGE_MAX_AUDIO_BITRATE_KBPS
    };
    if (audioTrack) {
      streams.push(new LocalStageStream(audioTrack, audioConfig));
    }

    const videoTrack = this.mediaStreamToPublish?.getVideoTracks()[0];
    const videoConfig = {
      maxBitrate: STAGE_MAX_BITRATE,
      maxFramerate: STAGE_MAX_FRAMERATE,
      ...(this.simulcast && { simulcast: this.simulcast })
    };
    if (videoTrack) {
      streams.push(new LocalStageStream(videoTrack, videoConfig));
    }

    return streams;
  }

  shouldPublishParticipant() {
    return this.shouldPublish;
  }

  shouldSubscribeToParticipant(participant) {
    /**
     * Only subscribe to participants in the same participant group.
     *
     * This creates a separation of concerns between different groups of
     * participants that should be uniquely managed, while deduplicating
     * participant state when multiple Stage instances connect to the
     * same Stage backend resource.
     */
    if (participant.attributes.participantGroup !== this.participantGroup) {
      return SubscribeType.NONE;
    }

    return this.subscribeType;
  }

  mutators(stage) {
    /**
     * Calling 'mutators' with a Stage instance should replace that Stage's
     * strategy with the one for which the mutators will be generated.
     */
    stage.replaceStrategy(this);

    return {
      publish: this.publishMutator(stage),
      unpublish: this.unpublishMutator(stage),
      republish: this.republishMutator(stage),
      resubscribe: this.resubscribeMutator(stage),
      updateStreamsToPublish: this.updateStreamsMutator(stage),
      setSubscribeType: this.setSubscribeTypeMutator(stage),
      setSimulcast: this.setSimulcastMutator(stage)
    };
  }

  publishMutator(stage) {
    /**
     * Invoking the `publish` method can optionally serve a dual purpose:
     *
     * 1. Sets the value of `shouldPublish` to `true` to attempt publishing
     *
     * 2. Optional: if `mediaStreamToPublish` is provided, then the streams
     *    to publish are updated as part of the same strategy refresh
     *
     * As such, `publish` can be invoked to seamlessly update an already published stream,
     * or to start publishing with a new or previously published stream, if one exists.
     * This is especially useful with publishing display/screen-share streams.
     */
    return (mediaStreamToPublish) => {
      if (mediaStreamToPublish) {
        this.mediaStreamToPublish = mediaStreamToPublish;
      }

      this.shouldPublish = true;
      stage.refreshStrategy();
    };
  }

  unpublishMutator(stage) {
    return () => {
      /**
       * Only update `shouldPublish` and leave `mediaStreamToPublish` as is
       * to allow for the currently media stream to be re-published later.
       */
      this.shouldPublish = false;
      stage.refreshStrategy();
    };
  }

  republishMutator(stage) {
    const publish = this.publishMutator(stage);
    const unpublish = this.unpublishMutator(stage);

    return () =>
      /**
       * Temporary event listeners are registered to re-publish the
       * local participant stream only when we receive confirmation
       * that the stream has been unpublished.
       */
      new Promise((resolve, reject) => {
        let publishTimeout;

        function onPublishChange(_, state) {
          if (state === StageParticipantPublishState.NOT_PUBLISHED) {
            // Delay publishing to avoid race conditions
            publishTimeout = setTimeout(publish, 400);
          }

          if (state === StageParticipantPublishState.PUBLISHED) {
            resolve();
            finishRepublish();
          }
        }

        function onStageError(error) {
          if (error.category === StageErrorCategory.PUBLISH_ERROR) {
            reject(new Error('Failed to re-publish!', { cause: error }));
            finishRepublish();
          }
        }

        function finishRepublish() {
          clearTimeout(publishTimeout);
          stage.off(STAGE_ERROR, onStageError);
          stage.off(STAGE_PARTICIPANT_PUBLISH_STATE_CHANGED, onPublishChange);
          stage.emit(STAGE_PARTICIPANT_REPUBLISH_STATE_CHANGED, false);
        }

        if (this.shouldPublish) {
          stage.on(STAGE_ERROR, onStageError);
          stage.on(STAGE_PARTICIPANT_PUBLISH_STATE_CHANGED, onPublishChange);
          stage.emit(STAGE_PARTICIPANT_REPUBLISH_STATE_CHANGED, true);
          unpublish();
        } else resolve();
      });
  }

  resubscribeMutator(stage) {
    const setSubscribeType = this.setSubscribeTypeMutator(stage);

    return () => {
      if (this.subscribed) {
        const currentSubscribeType = this.subscribeType;

        setSubscribeType(SubscribeType.NONE);
        setSubscribeType(currentSubscribeType);
      }
    };
  }

  updateStreamsMutator(stage) {
    return (mediaStreamToPublish) => {
      this.mediaStreamToPublish = mediaStreamToPublish;
      stage.refreshStrategy();
    };
  }

  setSubscribeTypeMutator(stage) {
    return (subscribeType) => {
      if (subscribeType === this.subscribeType) {
        return;
      }

      this.subscribeType = subscribeType;
      stage.refreshStrategy();
    };
  }

  setSimulcastMutator(stage) {
    const republish = this.republishMutator(stage);

    return async (simulcast) => {
      if (deepEqual(simulcast, this.simulcast)) {
        return;
      }

      const currentSimulcast = this.simulcast;
      this.simulcast = simulcast;

      /**
       * If the local participant should publish, then we need to re-publish to
       * apply the new Simulcast configuration. Otherwise, the new Simulcast
       * configuration will be applied on the next publication.
       */
      if (this.shouldPublish) {
        try {
          await republish();
        } catch (error) {
          console.error(error);

          // Rollback the Simulcast configuration to its initial value
          this.simulcast = currentSimulcast;
          stage.refreshStrategy();

          throw error;
        }
      } else stage.refreshStrategy();
    };
  }
}

export default StageStrategy;
