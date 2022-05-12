import { dashboard as $dashboardContent } from '../../../../../content';
import { CHANNEL_TYPE } from '../../../../../constants';

const $content = $dashboardContent.stream_session_page.encoder_configuration;

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
    transform: ([sampleRate]) => Math.floor(sampleRate / 1000),
    units: $content.kHz,
    validate: ([audioSampleRate]) =>
      !audioSampleRate || audioSampleRate === 44100 || audioSampleRate === 48000
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
    validate: ([audioChannels]) => audioChannels <= 2
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
      const pixels = videoWidth * videoHeight;
      const edgeLimitBasic = 855;
      const edgeLimitStandard = 1920;

      if (
        channelType === CHANNEL_TYPE.BASIC &&
        (pixels > 415000 ||
          videoHeight > edgeLimitBasic ||
          videoWidth > edgeLimitBasic)
      ) {
        return false;
      }

      if (
        channelType === CHANNEL_TYPE.STANDARD &&
        (pixels > 2100000 ||
          videoHeight > edgeLimitStandard ||
          videoWidth > edgeLimitStandard)
      ) {
        return false;
      }

      return true;
    }
  },
  {
    id: 'video-keyframe-interval',
    label: $content.keyframe_interval,
    path: [['video', 'keyframeIntervalAvg']], // Retrieved from Metrics API
    transform: ([keyframeInterval]) => keyframeInterval.toFixed(1),
    units: '',
    validate: ([keyframeInterval]) => keyframeInterval < 3
  },
  {
    id: 'video-target-bitrate',
    label: $content.target_bitrate,
    path: [['video', 'targetBitrate']],
    transform: ([targetBitrate]) => targetBitrate * Math.pow(10, -6),
    units: $content.mbps,
    validate: ([targetBitrate], channelType) => {
      if (channelType === CHANNEL_TYPE.BASIC && targetBitrate > 1500000)
        return false;
      if (channelType === CHANNEL_TYPE.STANDARD && targetBitrate > 8500000)
        return false;

      return true;
    }
  },
  {
    id: 'audio-target-bitrate',
    label: $content.target_audio_bitrate,
    path: [['audio', 'targetBitrate']],
    transform: ([targetAudioBitrate]) => targetAudioBitrate * Math.pow(10, -3),
    units: $content.kbps,
    validate: (targetAudioBitrate) => targetAudioBitrate <= 320000
  }
];

export const processEncoderConfigData = (ingestConfiguration, channelType) => {
  if (!ingestConfiguration)
    return ENCODER_CONFIG_DATA.map(({ id, label }) => {
      return { id, label, value: '----' };
    });

  return ENCODER_CONFIG_DATA.map(
    ({
      id,
      label,
      path,
      transform = (values) => values[0],
      units,
      validate = () => true
    }) => {
      const values = path.map(([type, key]) => ingestConfiguration[type][key]);
      const error = !validate(values, channelType);

      let value = '----';
      if (values.length && !values.some((v) => !v)) {
        value = transform(values) + ` ${units}`;
        value = value.trim();
      }

      return { id, label, value, error };
    }
  );
};
