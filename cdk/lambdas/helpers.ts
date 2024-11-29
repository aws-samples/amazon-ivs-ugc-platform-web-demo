import { convertToAttr } from '@aws-sdk/util-dynamodb';
import {
  AttributeValueUpdate,
  BatchWriteItemCommand,
  DynamoDBClient,
  QueryCommand,
  UpdateItemCommand,
  WriteRequest
} from '@aws-sdk/client-dynamodb';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import {
  IVSRealTimeClient,
  StageSummary,
  DeleteStageCommand
} from '@aws-sdk/client-ivs-realtime';

export const cognitoClient = new CognitoIdentityProviderClient({});
export const dynamoDbClient = new DynamoDBClient({});
export const ivsRealTimeClient = new IVSRealTimeClient({});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

/**
 * Cleanup Idle Stages
 */

export const getIdleStages = (stages: StageSummary[]) => {
  const currentTimestamp = Date.now();
  const millisecondsPerHour = 60 * 60 * 1000;
  const hoursThreshold = 1;

  return stages
    .filter(
      ({ tags }) =>
        !!tags?.project &&
        !!process.env.PROJECT_TAG &&
        tags?.project === process.env.PROJECT_TAG
    ) // Filter list of stages by project tag
    .filter((stage) => stage.activeSessionId === '')
    .filter((idleStage) => {
      const creationDate: string = idleStage?.tags?.creationDate || '';
      if (!creationDate) return false;

      const timeDifferenceHours: number =
        (currentTimestamp - parseInt(creationDate)) / millisecondsPerHour;

      return timeDifferenceHours > hoursThreshold;
    });
};

export const getIdleStageArns = (idleStages: StageSummary[]) =>
  idleStages
    .map((idleAndOldStage) => idleAndOldStage.arn)
    .filter((arn) => typeof arn === 'string') as string[];

const getDeleteStagePromises = (stageArns: string[]) =>
  stageArns.map((stageArn) => {
    return new Promise(async (resolve, rejects) => {
      const deleteStageCommand = new DeleteStageCommand({
        arn: stageArn
      });

      try {
        const response = await ivsRealTimeClient.send(deleteStageCommand);

        resolve(response);
      } catch (e) {
        console.error(e);
        rejects({ stageArn });
      }
    });
  });

const chunkIntoArrayBatches = (arr: string[], maxItemsPerBatch: number = 5) => {
  const batches = [];
  let currentIndex = 0;

  while (currentIndex < arr.length) {
    batches.push(arr.slice(currentIndex, currentIndex + maxItemsPerBatch));
    currentIndex += maxItemsPerBatch;
  }

  return batches;
};

const analyzeDeleteStageResponse = (
  deleteStageResponse: PromiseSettledResult<unknown>[],
  stageArnBatch: string[],
  isRetry: boolean = false
) => {
  const failedToDeleteStages: string[] = deleteStageResponse
    .filter((promise) => isRejected(promise))
    .map((promiseResult) => {
      const reason = (promiseResult as PromiseRejectedResult).reason;

      return reason.stageArn;
    });

  const deletedStages = stageArnBatch.filter(
    (stageArn: string) => !failedToDeleteStages.includes(stageArn)
  );

  if (deletedStages.length) {
    console.log(
      `A total of ${
        deletedStages.length
      } stages have successfully been deleted: ${deletedStages.join(', ')}${
        isRetry ? 'on retry attempt 2.' : '.'
      }`
    );
  }

  if (isRetry && failedToDeleteStages.length) {
    console.log(
      `A total of ${
        deletedStages.length
      } stages have failed to delete ${failedToDeleteStages.join(
        ', '
      )} on retry.`
    );
  }

  return {
    failedToDeleteStages
  };
};

export const deleteStagesWithRetry = async (stageArns: string[]) => {
  if (!stageArns.length) return;

  const stagesToDelete = chunkIntoArrayBatches(stageArns, 5);
  const retryDeleteBatchArray: string[][] = [];

  for (let i = 0; i < stagesToDelete.length; i++) {
    const batch = stagesToDelete[i];
    const response = await Promise.allSettled(getDeleteStagePromises(batch));
    const { failedToDeleteStages } = analyzeDeleteStageResponse(
      response,
      batch
    );

    if (failedToDeleteStages.length)
      retryDeleteBatchArray.push(failedToDeleteStages);

    // Allow for 1s to pass to avoid 5TPS limit set by IVS
    await wait(i > 0 ? 1000 : 0);
  }

  // Retry
  for (let i = 0; i < retryDeleteBatchArray.length; i++) {
    const retryBatch = retryDeleteBatchArray[i];
    const response = await Promise.allSettled(
      getDeleteStagePromises(retryBatch)
    );

    analyzeDeleteStageResponse(response, retryBatch, true);
  }
};

type DynamoKey = { key: string; value: string };

export const updateDynamoItemAttributes = ({
  attributes = [],
  primaryKey,
  sortKey,
  tableName
}: {
  attributes: { key: string; value: any }[];
  primaryKey: DynamoKey;
  sortKey?: DynamoKey;
  tableName: string;
}) => {
  if (!attributes.length) return;

  const attributesToUpdate = attributes.reduce(
    (acc, { key, value }) => ({
      ...acc,
      [key]: {
        Action: 'PUT',
        Value: convertToAttr(value, {
          removeUndefinedValues: true
        })
      }
    }),
    {}
  ) as { [key: string]: AttributeValueUpdate };

  const putItemCommand = new UpdateItemCommand({
    AttributeUpdates: attributesToUpdate,
    Key: {
      [primaryKey.key]: convertToAttr(primaryKey.value),
      ...(sortKey ? { [sortKey.key]: convertToAttr(sortKey.value) } : {})
    },
    TableName: tableName
  });

  return dynamoDbClient.send(putItemCommand);
};
