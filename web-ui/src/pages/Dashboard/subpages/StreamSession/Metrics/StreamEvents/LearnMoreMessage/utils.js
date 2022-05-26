import { CHANNEL_TYPE } from '../../../../../../../constants';

const DEFAULT_VIEWER_LIMIT = 15000;
const BASIC_BITRATE_LIMIT = 1500; // kbps
const STANDARD_BITRATE_LIMIT = 8500; // kbps
const BASIC_RESOLUTION_LIMIT = '480p (852 x 480)';
const STANDARD_RESOLUTION_LIMIT = '1080p (1920 x 1080)';

const VIEWER_LIMIT_SUB_KEY = '{VIEWER_LIMIT}';
const BITRATE_LIMIT_SUB_KEY = '{BITRATE_LIMIT}';
const RESOLUTION_LIMIT_SUB_KEY = '{RESOLUTION_LIMIT}';
const CHANNEL_TYPE_SUB_KEY = '{channelType}';
const BITRATE_SUB_KEY = '{bitrate}';
const RESOLUTION_SUB_KEY = '{resolution}';

export const substitutePlaceholders = (str = '', activeStreamSession) => {
  // Viewer limit substitutions
  str = str.replaceAll(
    VIEWER_LIMIT_SUB_KEY,
    DEFAULT_VIEWER_LIMIT.toLocaleString()
  );

  if (!activeStreamSession) return str;

  const {
    channel: { type: channelType },
    ingestConfiguration: {
      video: { videoWidth, videoHeight, targetBitrate }
    }
  } = activeStreamSession;

  // Channel type substitutions
  str = str.replaceAll(CHANNEL_TYPE_SUB_KEY, channelType);

  // Bitrate substitutions
  const targetBitrateKbps = targetBitrate * Math.pow(10, -3);
  str = str.replaceAll(BITRATE_SUB_KEY, targetBitrateKbps.toLocaleString());

  str = str.replaceAll(
    BITRATE_LIMIT_SUB_KEY,
    channelType === CHANNEL_TYPE.BASIC
      ? BASIC_BITRATE_LIMIT.toLocaleString()
      : STANDARD_BITRATE_LIMIT.toLocaleString()
  );

  // Resolution substitutions
  const resolution = `${videoWidth} x ${videoHeight}`;
  str = str.replaceAll(RESOLUTION_SUB_KEY, resolution);

  str = str.replaceAll(
    RESOLUTION_LIMIT_SUB_KEY,
    channelType === CHANNEL_TYPE.BASIC
      ? BASIC_RESOLUTION_LIMIT.toLocaleString()
      : STANDARD_RESOLUTION_LIMIT.toLocaleString()
  );

  return str;
};
