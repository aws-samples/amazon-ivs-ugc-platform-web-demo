const {
  BatchWriteItemCommand,
  DynamoDBClient,
  ScanCommand
} = require('@aws-sdk/client-dynamodb');
const { convertToAttr } = require('@aws-sdk/util-dynamodb');

const { REGION, TABLES_TO_SEED, chunkifyRequests } = require('./utils');

const createDeleteRequest = (list) =>
  list.map((item) => ({
    DeleteRequest: {
      Key: item
    }
  }));

(async () => {
  try {
    const dynamoDbClient = new DynamoDBClient({ region: REGION });

    // Scan for all users and filter by id begins with mock-user-id
    const usersScanCommand = new ScanCommand({
      TableName: TABLES_TO_SEED.channel,
      ProjectionExpression: 'id',
      ExpressionAttributeValues: { ':filterBy': { S: 'mock-user-id' } },
      FilterExpression: 'begins_with(id,:filterBy)'
    });
    const { Items: mockUsers } = await dynamoDbClient.send(usersScanCommand);

    // Scan for all stream sessions and filter by id begins with mock-stream-id
    const streamSessionsQueryCommand = new ScanCommand({
      TableName: TABLES_TO_SEED.stream,
      ProjectionExpression: 'channelArn, id',
      ExpressionAttributeValues: {
        ':filterBy': convertToAttr('mock-stream-id')
      },
      FilterExpression: 'begins_with(id,:filterBy)'
    });
    const { Items: mockStreams } = await dynamoDbClient.send(
      streamSessionsQueryCommand
    );

    const userReqs = createDeleteRequest(mockUsers);
    const streamSessionReqs = createDeleteRequest(mockStreams);

    const timesToWrite = Math.ceil(
      (userReqs.length + streamSessionReqs.length) / 24
    );
    const chunkedUserReqs = chunkifyRequests(userReqs);
    const chunkedStreamReqs = chunkifyRequests(streamSessionReqs);

    for (let i = 0; i < timesToWrite; i += 1) {
      const batchWriteCommand = new BatchWriteItemCommand({
        RequestItems: {
          [TABLES_TO_SEED.channel]: chunkedUserReqs[i],
          [TABLES_TO_SEED.stream]: chunkedStreamReqs[i]
        }
      });

      await dynamoDbClient.send(batchWriteCommand);
    }

    console.log('Deleted items successfully');
  } catch (err) {
    console.log('Error', err);
  }
})();
