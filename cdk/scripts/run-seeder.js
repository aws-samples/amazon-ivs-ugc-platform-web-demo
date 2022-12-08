const {
  BatchWriteItemCommand,
  DynamoDBClient
} = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');
const { readFileSync } = require('fs');
const { v4: uuidv4 } = require('uuid');

const {
  PLAYBACK_URLS,
  PROFILE_AVATARS,
  PROFILE_COLORS,
  REGION,
  TABLES_TO_SEED,
  chunkifyRequests
} = require('./utils');

const createMockPutRequest = (data, mockIdentifier) => {
  if (!data.id.startsWith(mockIdentifier)) {
    data.id = `${mockIdentifier}-${data.id}`;
  }

  return {
    PutRequest: {
      Item: marshall(data)
    }
  };
};

const createRequestsFromJson = (json) => {
  let userReqs = [];
  let streamSessionReqs = [];

  if (json) {
    const users = json.users;
    const streamSessions = json.streamSessions;

    if (users && Array.isArray(users)) {
      userReqs = users.map((user) =>
        createMockPutRequest(user, 'mock-user-id')
      );
    }

    if (streamSessions && Array.isArray(streamSessions)) {
      streamSessionReqs = streamSessions.map((streamSession) =>
        createMockPutRequest(streamSession, 'mock-stream-id')
      );
    }
  }

  return { userReqs, streamSessionReqs };
};

const createRequests = (count = 1, json) => {
  const { userReqs, streamSessionReqs } = createRequestsFromJson(json);
  const randomSeedCount =
    count >= streamSessionReqs.length ? count - streamSessionReqs.length : 0;

  for (let i = 0; i < randomSeedCount; i += 1) {
    const startTime = new Date(new Date() - i * 90000); // current time subtracted by i * 90 seconds
    const uuid = uuidv4();
    const timeLow = uuid.split('-')[0];
    const channelArn = `arn:aws:ivs:us-west-2:000000000000:channel/mock-${uuid}`;

    userReqs.push({
      PutRequest: {
        Item: marshall({
          id: `mock-user-id-${uuid}`,
          avatar:
            PROFILE_AVATARS[Math.floor(Math.random() * PROFILE_AVATARS.length)],
          channelArn,
          chatRoomArn: '',
          color:
            PROFILE_COLORS[Math.floor(Math.random() * PROFILE_COLORS.length)],
          email: `fake+${timeLow}@ugc.com`,
          ingestEndpoint: '',
          playbackUrl:
            PLAYBACK_URLS[Math.floor(Math.random() * PLAYBACK_URLS.length)],
          streamKeyArn: '',
          streamKeyValue: '',
          username: `mockUser${timeLow}`
        })
      }
    });

    streamSessionReqs.push({
      PutRequest: {
        Item: marshall({
          channelArn,
          id: `mock-stream-id-${uuid}`,
          hasErrorEvent: false,
          isHealthy: true,
          startTime: startTime.toISOString(),
          userSub: uuid,
          truncatedEvents: [
            {
              name: 'Stream Start'
            }
          ],
          isOpen: 'true'
        })
      }
    });
  }

  return { userReqs, streamSessionReqs };
};

(async () => {
  try {
    const dynamoDbClient = new DynamoDBClient({ region: REGION });
    let jsonOutput;
    const jsonPath = process.argv[3];
    let seedCount = parseInt(process.argv[2]);
    if (isNaN(seedCount)) throw Error('Invalid value for SEED_COUNT.');

    if (jsonPath) {
      const json = readFileSync(jsonPath);
      jsonOutput = JSON.parse(json);
    }

    const { userReqs, streamSessionReqs } = createRequests(
      seedCount,
      jsonOutput
    );

    const timesToWrite = Math.ceil(
      (userReqs.length + streamSessionReqs.length) / 24
    );
    const chunkedUserReqs = chunkifyRequests(userReqs);
    const chunkedStreamReqs = chunkifyRequests(streamSessionReqs);

    // Batch create users and streams
    for (let i = 0; i < timesToWrite; i += 1) {
      const batchWriteCommand = new BatchWriteItemCommand({
        RequestItems: {
          [TABLES_TO_SEED.channel]: chunkedUserReqs[i],
          [TABLES_TO_SEED.stream]: chunkedStreamReqs[i]
        }
      });

      await dynamoDbClient.send(batchWriteCommand);
    }
    console.log('Seeded Items Successfully');
  } catch (err) {
    console.error(err);
  }
})();
