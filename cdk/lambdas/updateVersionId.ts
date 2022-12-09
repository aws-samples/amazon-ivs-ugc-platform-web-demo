import { S3Event, SQSBatchResponse, SQSHandler } from 'aws-lambda';
import { unmarshall, convertToAttr } from '@aws-sdk/util-dynamodb';
import { UpdateItemCommand } from '@aws-sdk/client-dynamodb';

import {
  dynamoDbClient,
  getChannelByChannelAssetId,
  isFulfilled,
  isRejected
} from './helpers';

interface UploadEvent {
  // Retrieved from S3 event
  assetType: string;
  channelAssetId: string;
  messageId: string;
  nextSequencer: string;
  versionId: string;
  // Retrieved from DynamoDB Channel table
  id?: string;
  prevSequencer?: string;
}

export const handler: SQSHandler = async (message) => {
  const uploadEvents: UploadEvent[] = message.Records.map(
    ({ body, messageId }) => {
      const s3Event: S3Event = JSON.parse(body);
      const {
        s3: {
          object: { key, sequencer: nextSequencer, versionId }
        }
      } = s3Event.Records[0];
      const [channelAssetId, assetType] = key.split('/');

      return {
        assetType,
        channelAssetId,
        messageId,
        nextSequencer,
        versionId: versionId!
      };
    }
  );
  const response: SQSBatchResponse = { batchItemFailures: [] };
  const addBatchItemFailure = (messageId: string) =>
    response.batchItemFailures.push({ itemIdentifier: messageId });

  // Retrieve the sub (id) and prevSequencer for the channel records corresponding to the upload events
  const channelQueryPromises = uploadEvents.map(
    (event) =>
      new Promise<UploadEvent>(async (resolve, reject) => {
        try {
          const { Items = [] } = await getChannelByChannelAssetId(
            event.channelAssetId
          );

          const { channelAssets, id } = unmarshall(Items[0]);
          const { sequencer: prevSequencer } =
            channelAssets?.[event.assetType] || {};

          resolve({ ...event, prevSequencer, id });
        } catch (error) {
          reject({ ...event, error });
        }
      })
  );
  const channelQueryResults = await Promise.allSettled(channelQueryPromises);

  // Filter out the upload events that are outdated based on event sequencer comparison and populate
  // the batchItemFailures list with the events corresponding to the failed channel queries
  const eventsToProcess = channelQueryResults.reduce((channels, data) => {
    if (isFulfilled(data)) {
      const { nextSequencer, prevSequencer } = data.value;
      const shouldDiscardEvent =
        !!prevSequencer && prevSequencer > nextSequencer; // prevent update race conditions

      return shouldDiscardEvent ? channels : [...channels, data.value];
    }

    if (isRejected(data)) {
      const { messageId } = data.reason;
      addBatchItemFailure(messageId);
    }

    return channels;
  }, [] as UploadEvent[]);

  // Update the channel asset URL and sequencer in the Channels table for each processable upload event
  const channelUpdatePromises = eventsToProcess.map((event) => {
    const { assetType, channelAssetId, nextSequencer, id, versionId } = event;
    const { CHANNEL_ASSETS_BASE_URL, CHANNELS_TABLE_NAME } = process.env;
    const key = `${channelAssetId}/${assetType}`;
    const url = `${CHANNEL_ASSETS_BASE_URL}/${key}?versionId=${versionId}`;
    const channelAssetValue = {
      url,
      sequencer: nextSequencer,
      lastModified: Date.now()
    };

    return new Promise<UploadEvent>(async (resolve, reject) => {
      try {
        await dynamoDbClient.send(
          new UpdateItemCommand({
            TableName: CHANNELS_TABLE_NAME,
            Key: { id: convertToAttr(id) },
            UpdateExpression: `SET channelAssets.#${assetType} = :channelAssetValue`,
            ExpressionAttributeNames: { [`#${assetType}`]: assetType },
            ExpressionAttributeValues: {
              ':channelAssetValue': convertToAttr(channelAssetValue)
            }
          })
        );

        resolve(event);
      } catch (error) {
        reject({ ...event, error });
      }
    });
  });
  const channelUpdateResults = await Promise.allSettled(channelUpdatePromises);

  // Populate the batchItemFailures list with the events corresponding to the failed channel updates
  for (let data of channelUpdateResults) {
    if (isRejected(data)) {
      const { messageId } = data.reason;
      addBatchItemFailure(messageId);
    }
  }

  return response;
};
