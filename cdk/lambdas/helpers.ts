import { convertToAttr } from '@aws-sdk/util-dynamodb';
import {
  BatchWriteItemCommand,
  DynamoDBClient,
  QueryCommand,
  WriteRequest
} from '@aws-sdk/client-dynamodb';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

export const cognitoClient = new CognitoIdentityProviderClient({});
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

export const convertToChunks = (
  array: object[],
  chunkSize: number
): { [key: number]: typeof array } => {
  const result: { [key: number]: typeof array } = {};
  let keyIndex = 0;

  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk: object[] = array.slice(i, i + chunkSize);
    result[keyIndex] = chunk;
    keyIndex += 1;
  }

  return result;
};

export const batchDeleteItemsWithRetry = async (
  requestItems: Record<string, WriteRequest[]> | undefined,
  retryCount = 0,
  maxRetries = 4
): Promise<void> => {
  const batchWriteCommandInput = {
    RequestItems: requestItems
  };
  const batchWriteCommand = new BatchWriteItemCommand(batchWriteCommandInput);
  const response = await dynamoDbClient.send(batchWriteCommand);

  if (response.UnprocessedItems && response.UnprocessedItems.length) {
    if (retryCount > maxRetries)
      throw new Error(
        `Failed to batch delete AWS DynamoDB items: ${response.UnprocessedItems}`
      );

    await new Promise((resolve) => setTimeout(resolve, 2 ** retryCount * 10));

    return batchDeleteItemsWithRetry(response.UnprocessedItems, retryCount + 1);
  }
};
