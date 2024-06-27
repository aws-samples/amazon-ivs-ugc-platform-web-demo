const { SubscribeType } = window.IVSBroadcastClient;

class Strategy {
  constructor() {
    this.audioTrack = undefined;
    this.videoTrack = undefined;
  }

  /**
   * Stage Strategy accessors
   */
  get def() {
    return {
      stageStreamsToPublish: this.stageStreamsToPublish.bind(this),
      shouldPublishParticipant: this.shouldPublishParticipant.bind(this),
      shouldSubscribeToParticipant: this.shouldSubscribeToParticipant.bind(this)
    };
  }

  stageStreamsToPublish() {
    return [this.audioTrack, this.videoTrack];
  }

  shouldPublishParticipant() {
    return true;
  }

  shouldSubscribeToParticipant() {
    return SubscribeType.AUDIO_VIDEO;
  }

  stopTracks() {
    this.audioTrack?.mediaStreamTrack.stop();
    this.videoTrack?.mediaStreamTrack.stop();
  }

  resetTracks() {
    this.updateTracks(undefined, undefined);
  }

  /**
   * Stage Strategy mutators
   */
  mutators(stage) {
    stage.replaceStrategy(this.def);

    return {
      refresh: this.refreshMutator(stage).bind(this)
    };
  }

  refreshMutator(stage) {
    return () => {
      stage.refreshStrategy();
    };
  }

  stopAndResetTracks() {
    this.stopTracks();
    this.resetTracks();
  }
}

export default Strategy;
