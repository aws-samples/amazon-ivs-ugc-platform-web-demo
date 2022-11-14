const { readFileSync } = require('fs');

const inputPath = 'seed_temp_out.txt';
const textFile = readFileSync(inputPath, { encoding: 'utf8' });
const getEnvVariable = (name) => textFile.split(`${name}="`)[1].split('"')[0];

const REGION = getEnvVariable('REGION');

const TABLES_TO_SEED = {
  channel: getEnvVariable('CHANNELS_TABLE_NAME'),
  stream: getEnvVariable('STREAM_TABLE_NAME')
};

const PROFILE_COLORS = [
  'blue',
  'green',
  'lavender',
  'purple',
  'salmon',
  'turquoise',
  'yellow'
];

const PROFILE_AVATARS = [
  'bear',
  'bird',
  'bird2',
  'dog',
  'dog2',
  'dog3',
  'giraffe',
  'hedgehog',
  'hippo',
  'horse',
  'ibex',
  'jellyfish',
  'sheep',
  'tiger'
];

const PLAYBACK_URLS = [
  'https://4c62a87c1810.us-west-2.playback.live-video.net/api/video/v1/us-west-2.049054135175.channel.WP4bWqiALo67.m3u8',
  'https://fcc3ddae59ed.us-west-2.playback.live-video.net/api/video/v1/us-west-2.893648527354.channel.DmumNckWFTqz.m3u8',
  'https://4c62a87c1810.us-west-2.playback.live-video.net/api/video/v1/us-west-2.049054135175.channel.FMaC7IMoyDEA.m3u8',
  'https://3d26876b73d7.us-west-2.playback.live-video.net/api/video/v1/us-west-2.913157848533.channel.xJ2tVekwmMGd.m3u8'
];

/*
 * We cannot batch more than 25 requests in the batch. This is the reason why we need to chunk the requests so we can run BatchWriteItemCommand multiple times.
 */
const chunkifyRequests = (requests) => {
  const chunkedRequests = [];
  const chunkSize = Math.floor(25 / Object.keys(TABLES_TO_SEED).length); // Max items that can be created for each table

  for (let i = 0; i < requests.length; i += chunkSize) {
    chunkedRequests.push(requests.slice(i, i + chunkSize));
  }

  return chunkedRequests;
};

module.exports = {
  PLAYBACK_URLS,
  PROFILE_AVATARS,
  PROFILE_COLORS,
  REGION,
  TABLES_TO_SEED,
  chunkifyRequests
};
