import { CHANNEL_TYPE, CONCURRENT_VIEWS } from '../../../../../../../constants';

const DEFAULT_VIEWER_LIMIT = 15000;
const BASIC_BITRATE_LIMIT = 1500; // kbps
const STANDARD_BITRATE_LIMIT = 8500; // kbps
const BASIC_RESOLUTION_LIMIT = '480p (852 x 480)';
const STANDARD_RESOLUTION_LIMIT = '1080p (1920 x 1080)';

const VIEWER_LIMIT_SUB_KEY = '{VIEWER_LIMIT}';
const BITRATE_LIMIT_SUB_KEY = '{BITRATE_LIMIT}';
const RESOLUTION_LIMIT_SUB_KEY = '{RESOLUTION_LIMIT}';
const BITRATE_SUB_KEY = '{bitrate}';
const CONCURRENT_VIEWERS_SUB_KEY = '{concurrent_viewers}';

export const substitutePlaceholders = (str = '', activeStreamSession) => {
  if (!activeStreamSession) return str;

  const { channel, ingestConfiguration, metrics } = activeStreamSession;
  const { targetBitrate } = ingestConfiguration?.video || {};
  const { type: channelType } = channel || {};

  // Concurrent viewers substitutions
  const concurrentViewsMetric = metrics?.find(
    (metric) => metric.label === CONCURRENT_VIEWS
  );
  const maxConcurrentViews = concurrentViewsMetric?.statistics?.maximum || 0;
  str = str.replaceAll(CONCURRENT_VIEWERS_SUB_KEY, maxConcurrentViews);

  str = str.replaceAll(
    VIEWER_LIMIT_SUB_KEY,
    DEFAULT_VIEWER_LIMIT.toLocaleString()
  );

  // Bitrate substitutions
  const targetBitrateKbps = targetBitrate * Math.pow(10, -3) || 0;
  str = str.replaceAll(BITRATE_SUB_KEY, targetBitrateKbps.toLocaleString());

  str = str.replaceAll(
    BITRATE_LIMIT_SUB_KEY,
    channelType === CHANNEL_TYPE.STANDARD
      ? STANDARD_BITRATE_LIMIT.toLocaleString()
      : BASIC_BITRATE_LIMIT.toLocaleString()
  );

  // Resolution substitutions
  str = str.replaceAll(
    RESOLUTION_LIMIT_SUB_KEY,
    channelType === CHANNEL_TYPE.STANDARD
      ? STANDARD_RESOLUTION_LIMIT.toLocaleString()
      : BASIC_RESOLUTION_LIMIT.toLocaleString()
  );

  return str;
};
