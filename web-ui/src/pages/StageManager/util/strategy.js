const { SubscribeType } = IVSBroadcastClient;

export default class Strategy {
    _videoStream = undefined;
    _audioStream = undefined;
    _subscribeType = SubscribeType.NONE;

    constructor(audioStream, videoStream, subscribeType = SubscribeType.AUDIO_VIDEO) {
        this._videoStream = videoStream;
        this._audioStream = audioStream;
        this._subscribeType = subscribeType;
    }

    updateMedia(audioStream, videoStream) {
        this._audioStream = audioStream;
        this._videoStream = videoStream;
    }

    stageStreamsToPublish() {
        return [this._videoStream, this._audioStream];
    }

    shouldPublishParticipant(participantInfo) {
        return true;
    }

    shouldSubscribeToParticipant(participantInfo) {
        return this._subscribeType;
    }
}
