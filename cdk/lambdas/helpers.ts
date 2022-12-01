import { convertToAttr } from '@aws-sdk/util-dynamodb';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';

export const dynamoDbClient = new DynamoDBClient({});

export const getChannelByChannelAssetId = (channelAssetId: string) => {
  const queryCommand = new QueryCommand({
    IndexName: 'channelAssetIdIndex',
    TableName: process.env.CHANNELS_TABLE_NAME,
    KeyConditionExpression: 'channelAssetId = :channelAssetId',
    ExpressionAttributeValues: {
      ':channelAssetId': convertToAttr(channelAssetId)
    }
  });

  return dynamoDbClient.send(queryCommand);
};

export const isRejected = (
  input: PromiseSettledResult<unknown>
): input is PromiseRejectedResult => input.status === 'rejected';

export const isFulfilled = <T>(
  input: PromiseSettledResult<T>
): input is PromiseFulfilledResult<T> => input.status === 'fulfilled';
