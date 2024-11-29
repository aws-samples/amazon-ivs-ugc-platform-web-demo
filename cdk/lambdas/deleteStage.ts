import { SQSBatchResponse, SQSHandler } from 'aws-lambda';
import {
  DeleteStageCommand,
  GetStageCommand,
  ListParticipantsCommand,
  ParticipantState
} from '@aws-sdk/client-ivs-realtime';
import { convertToAttr, unmarshall } from '@aws-sdk/util-dynamodb';
import { QueryCommand } from '@aws-sdk/client-dynamodb';
import {
  dynamoDbClient,
  updateDynamoItemAttributes,
  ivsRealTimeClient,
  isRejected,
  isFulfilled
} from './helpers';
import {
  buildStageArn,
  extractStageIdfromStageArn
} from '../api/stages/helpers';
import { buildChannelArn } from '../api/metrics/helpers';
import { CHANNELS_TABLE_STAGE_FIELDS } from '../api/shared/constants';

interface HostDisconnectedEvent {
  messageId: string;
  stageArn: string;
  stageId: string;
  sessionId?: string;
  channelId?: string;
  shouldDeleteStage: boolean;
}

export const handler: SQSHandler = async (message) => {
  const response: SQSBatchResponse = { batchItemFailures: [] };
  const addBatchItemFailure = (messageId: string) =>
    response.batchItemFailures.push({ itemIdentifier: messageId });

  const hostDisconnectedEvents: HostDisconnectedEvent[] = message.Records.map(
    ({ body, messageId }) => {
      let channelId;
      let { stageId, stageArn, sessionId, userId } = JSON.parse(body);

      // User
      if (!stageArn && stageId) {
        stageArn = buildStageArn(stageId);
      }
      if (stageArn && !stageId) {
        stageId = extractStageIdfromStageArn(stageArn);
      }

      if (userId) {
        channelId = userId.split('host:')[1];
      }

      return {
        messageId,
        sessionId,
        stageArn,
        stageId,
        channelId,
        shouldDeleteStage: true
      };
    }
  );

  const updateChannelPromises = hostDisconnectedEvents.map(
    ({
      stageId,
      stageArn,
      sessionId,
      messageId,
      channelId,
      shouldDeleteStage: defaultShouldDeleteStage
    }) => {
      return new Promise<HostDisconnectedEvent>(async (resolve, reject) => {
        let activeSessionId = sessionId;
        let stageOwnerChannelId = channelId;
        let shouldDeleteStage = defaultShouldDeleteStage;

        try {
          if (!activeSessionId || !stageOwnerChannelId) {
            const getStageCommand = new GetStageCommand({ arn: stageArn });
            const { stage } = await ivsRealTimeClient.send(getStageCommand);

            activeSessionId = stage?.activeSessionId;
            stageOwnerChannelId = stage?.tags?.stageOwnerChannelId;
          }
          const stageOwnerChannelArn = stageOwnerChannelId
            ? buildChannelArn(stageOwnerChannelId)
            : '';

          if (activeSessionId) {
            const listParticipantsCommand = new ListParticipantsCommand({
              stageArn,
              sessionId: activeSessionId,
              filterByUserId: `host:${stageOwnerChannelId}`
            });
            const { participants: hosts = [] } = await ivsRealTimeClient.send(
              listParticipantsCommand
            );
            shouldDeleteStage =
              hosts.every(
                (hostData) => hostData.state !== ParticipantState.CONNECTED
              ) && !!stageOwnerChannelArn;
          }

          if (shouldDeleteStage) {
            /**
             * Attempt to delete stageIds from the host's channel table
             */
            const queryCommand = new QueryCommand({
              IndexName: 'channelArnIndex',
              TableName: process.env.CHANNELS_TABLE_NAME,
              Limit: 1,
              KeyConditionExpression: 'channelArn = :channelArn',
              ExpressionAttributeValues: {
                ':channelArn': convertToAttr(stageOwnerChannelArn)
              }
            });
            const { Items } = await dynamoDbClient.send(queryCommand);

            if (Items) {
              const channelTableResponse = unmarshall(Items[0]);
              const { id: userSub, stageId: channelStageId } =
                channelTableResponse;

              if (channelStageId && stageId === channelStageId) {
                await updateDynamoItemAttributes({
                  attributes: [
                    {
                      key: CHANNELS_TABLE_STAGE_FIELDS.STAGE_ID,
                      value: null
                    },
                    {
                      key: CHANNELS_TABLE_STAGE_FIELDS.STAGE_CREATION_DATE,
                      value: null
                    }
                  ],
                  primaryKey: { key: 'id', value: userSub },
                  tableName: process.env.CHANNELS_TABLE_NAME as string
                });

                console.log('Channel record has been successfully updated!');
              }
            }
          }

          resolve({
            stageArn,
            stageId,
            messageId,
            shouldDeleteStage
          });
        } catch (error) {
          console.error(error);
          reject({ messageId, error });
        }
      });
    }
  );
  const updateChannelResults = await Promise.allSettled(updateChannelPromises);

  const deleteStagePromises = updateChannelResults.reduce((acc, result) => {
    if (isRejected(result)) {
      addBatchItemFailure(result.reason.messageId);
    }

    if (isFulfilled(result)) {
      const { stageArn, messageId, shouldDeleteStage } = result.value;

      if (shouldDeleteStage && stageArn) {
        acc.push(
          new Promise<{}>(async (resolve, reject) => {
            try {
              const deleteStageCommand = new DeleteStageCommand({
                arn: stageArn
              });
              await ivsRealTimeClient.send(deleteStageCommand);

              resolve({});
            } catch (error) {
              reject({ messageId, error });
            }
          })
        );
      }
    }

    return acc;
  }, [] as Promise<Awaited<{}>>[]);

  if (deleteStagePromises.length) {
    const deleteStageResults = await Promise.allSettled(deleteStagePromises);

    for (let result of deleteStageResults) {
      if (isRejected(result)) {
        addBatchItemFailure(result.reason.messageId);
      }
    }
  }

  return response;
};
