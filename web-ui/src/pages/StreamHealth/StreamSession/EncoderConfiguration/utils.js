import { CHANNEL_TYPE, NO_DATA_VALUE } from '../../../../constants';
import { dashboard as $dashboardContent } from '../../../../content';

const $content = $dashboardContent.stream_session_page.encoder_configuration;

const EDGE_LIMIT_480P = 855;
const EDGE_LIMIT_1080P = 1920;

const MAX_PIXEL_VALUE_480P = 415000;
const MAX_PIXEL_VALUE_1080P = 2100000;

const MAX_BITRATE_BASIC_480P = 1500000;
const MAX_BITRATE_BASIC_1080P = 3500000;
const MAX_BITRATE_STANDARD = 8500000;

const exceedsFullHdRes = (videoWidth, videoHeight) => {
  const pixels = videoWidth * videoHeight;

  return (
    pixels > MAX_PIXEL_VALUE_1080P ||
    videoHeight > EDGE_LIMIT_1080P ||
    videoWidth > EDGE_LIMIT_1080P
  );
};

const exceedsSdRes = (videoWidth, videoHeight) => {
  const pixels = videoWidth * videoHeight;

  return (
    pixels > MAX_PIXEL_VALUE_480P ||
    videoHeight > EDGE_LIMIT_480P ||
    videoWidth > EDGE_LIMIT_480P
  );
};

const ENCODER_CONFIG_DATA = [
  {
    id: 'video-encoder',
    label: $content.video_encoder,
    path: [['video', 'encoder']],
    units: ''
  },
  {
    id: 'video-codec',
    label: $content.video_codec,
    path: [['video', 'codec']],
    units: ''
  },
  {
    id: 'audio-codec',
    label: $content.audio_codec,
    path: [['audio', 'codec']],
    units: ''
  },
  {
    id: 'audio-sample-rate',
    label: $content.audio_sample_rate,
    path: [['audio', 'sampleRate']],
    transform: ([sampleRate]) => +Math.floor(sampleRate / 1000).toFixed(2),
    units: $content.kHz,
    validate: ([audioSampleRate]) => {
      if (!audioSampleRate) return null;
      else if (audioSampleRate !== 44100 && audioSampleRate !== 48000) {
        return 'encoderAudioSampleRateError';
      }
      return null;
    }
  },
  {
    id: 'audio-channels',
    label: $content.audio_channels,
    path: [['audio', 'channels']],
    transform: ([audioChannels]) => {
      switch (audioChannels) {
        case 1:
          return $content.mono;
        case 2:
          return $content.stereo;
        default:
          return audioChannels;
      }
    },
    units: '',
    validate: ([audioChannels]) =>
      audioChannels <= 2 ? null : 'encoderNumberOfAudioChannelsError'
  },
  {
    id: 'video-resolution',
    label: $content.resolution,
    path: [
      ['video', 'videoWidth'],
      ['video', 'videoHeight']
    ],
    transform: ([videoWidth, videoHeight]) => `${videoWidth} x ${videoHeight}`,
    units: '',
    validate: ([videoWidth, videoHeight], channelType) => {
      if (
        [
          CHANNEL_TYPE.BASIC,
          CHANNEL_TYPE.STANDARD,
          CHANNEL_TYPE.ADVANCED_HD,
          CHANNEL_TYPE.ADVANCED_SD
        ].includes(channelType) &&
        exceedsFullHdRes(videoWidth, videoHeight)
      )
        return 'encoderResolutionError';

      return null;
    }
  },
  {
    id: 'video-keyframe-interval',
    label: $content.keyframe_interval,
    path: [['video', 'keyframeIntervalAvg']], // Retrieved from Metrics API
    transform: ([keyframeInterval]) => keyframeInterval.toFixed(1),
    units: '',
    validate: ([keyframeInterval]) =>
      keyframeInterval < 3 ? null : 'encoderKeyframeIntervalError'
  },
  {
    id: 'video-target-bitrate',
    label: $content.target_bitrate,
    path: [
      ['video', 'targetBitrate'],
      ['video', 'videoWidth'],
      ['video', 'videoHeight']
    ],
    transform: ([targetBitrate]) =>
      +(targetBitrate * Math.pow(10, -6)).toFixed(2),
    units: $content.mbps,
    validate: ([targetBitrate, videoWidth, videoHeight], channelType) => {
      let hasEncoderTargetBitrateError = false;

      if (channelType === CHANNEL_TYPE.BASIC) {
        if (
          // Resolution > 480p and <= 1080p
          (exceedsSdRes(videoWidth, videoHeight) &&
            !exceedsFullHdRes(videoWidth, videoHeight) &&
            targetBitrate > MAX_BITRATE_BASIC_1080P) ||
          // Resolution <= 480p
          (!exceedsSdRes(videoWidth, videoHeight) &&
            targetBitrate > MAX_BITRATE_BASIC_480P)
        )
          hasEncoderTargetBitrateError = true;
      } else if (
        channelType === CHANNEL_TYPE.STANDARD &&
        targetBitrate > MAX_BITRATE_STANDARD
      ) {
        hasEncoderTargetBitrateError = true;
      }

      return hasEncoderTargetBitrateError ? 'encoderTargetBitrateError' : null;
    }
  },
  {
    id: 'audio-target-bitrate',
    label: $content.target_audio_bitrate,
    path: [['audio', 'targetBitrate']],
    transform: ([targetAudioBitrate]) =>
      +(targetAudioBitrate * Math.pow(10, -3)).toFixed(2),
    units: $content.kbps,
    validate: (targetAudioBitrate) =>
      targetAudioBitrate <= 320000 ? null : 'encoderTargetAudioBitrateError'
  }
];

export const processEncoderConfigData = (ingestConfiguration, channelType) => {
  if (!ingestConfiguration)
    return ENCODER_CONFIG_DATA.map(({ id, label }) => {
      return { id, label, value: NO_DATA_VALUE };
    });

  return ENCODER_CONFIG_DATA.map(
    ({
      id,
      label,
      path,
      transform = (values) => values[0],
      units,
      validate = () => null
    }) => {
      const values = path.map(([type, key]) => ingestConfiguration[type][key]);
      const error = validate(values, channelType);

      let value = NO_DATA_VALUE;
      if (values.length && !values.some((v) => !v)) {
        value = transform(values) + ` ${units}`;
        value = value.trim();
      }

      return { id, label, value, error };
    }
  );
};
