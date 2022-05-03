import { dashboard as $dashboardContent } from '../../../../../content';

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
    units: $content.kHz
  },
  {
    id: 'audio-channels',
    label: $content.audio_channels,
    path: [['audio', 'channels']],
    transform: ([channels]) => {
      switch (channels) {
        case 1:
          return $content.mono;
        case 2:
          return $content.stereo;
        default:
          return channels;
      }
    },
    units: ''
  },
  {
    id: 'video-resolution',
    label: $content.resolution,
    path: [
      ['video', 'videoWidth'],
      ['video', 'videoHeight']
    ],
    transform: ([videoWidth, videoHeight]) => `${videoWidth} x ${videoHeight}`,
    units: ''
  },
  {
    id: 'video-keyframe-interval',
    label: $content.keyframe_interval,
    path: [], // Retrieved from Metrics API
    units: ''
  },
  {
    id: 'video-target-bitrate',
    label: $content.target_bitrate,
    path: [['video', 'targetBitrate']],
    transform: ([targetBitrate]) => targetBitrate * Math.pow(10, -6),
    units: $content.mbps
  },
  {
    id: 'audio-target-bitrate',
    label: $content.target_audio_bitrate,
    path: [['audio', 'targetBitrate']],
    transform: ([targetBitrate]) => targetBitrate * Math.pow(10, -3),
    units: $content.kbps
  }
];

export const processEncoderConfigData = (ingestConfiguration) => {
  if (!ingestConfiguration)
    return ENCODER_CONFIG_DATA.map(({ id, label }) => {
      return { id, label, value: '----' };
    });

  return ENCODER_CONFIG_DATA.map(
    ({ id, label, path, transform = (values) => values[0], units }) => {
      const values = path.map(([type, key]) => ingestConfiguration[type][key]);

      let value = '----';
      if (values.length && !values.some((v) => !v)) {
        value = transform(values) + ` ${units}`;
        value = value.trim();
      }

      return { id, label, value };
    }
  );
};
