import { SQSHandler } from 'aws-lambda';
import {
  IVSRealTimeClient,
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
  ivsRealTimeClient
} from './helpers';

export const handler: SQSHandler = async (message) => {
  const hostDisconnectedEvents = message.Records.map(({ body }) => {
    let { stageId, stageArn, sessionId } = JSON.parse(body);

    if (!stageArn && stageId) {
      stageArn = `arn:aws:ivs:${process.env.REGION}:${process.env.ACCOUNT_ID}:stage/${stageId}`;
    }

    return {
      stageArn,
      sessionId
    };
  });

  const deleteStagePromises = hostDisconnectedEvents.map(
    ({ stageArn, sessionId }) => {
      return new Promise(async (resolve, reject) => {
        if (!stageArn) throw new Error('No stageArn');
        let activeSessionId = sessionId;
        let stageOwnerChannelId;

        try {
          if (!activeSessionId) {
            const getStageCommand = new GetStageCommand({ arn: stageArn });
            const { stage } = await ivsRealTimeClient.send(getStageCommand);

            activeSessionId = stage?.activeSessionId;
            stageOwnerChannelId = stage?.tags?.stageOwnerChannelId;
          }

          const stageOwnerChannelArn = `arn:aws:ivs:${process.env.REGION}:${process.env.ACCOUNT_ID}:channel/${stageOwnerChannelId}`;
          console.log(stageOwnerChannelArn);

          const listParticipantsCommand = new ListParticipantsCommand({
            stageArn,
            sessionId: activeSessionId,
            filterByUserId: `host:${stageOwnerChannelId}`
          });
          const { participants: hosts = [] } = await ivsRealTimeClient.send(
            listParticipantsCommand
          );
          const shouldDeleteStage = hosts.every(
            (hostData) => hostData.state !== ParticipantState.CONNECTED
          );

          if (shouldDeleteStage) {
            const deleteStageCommand = new DeleteStageCommand({
              arn: stageArn
            });
            await ivsRealTimeClient.send(deleteStageCommand);

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
              const { id: sub } = unmarshall(Items[0]);

              await updateDynamoItemAttributes({
                attributes: [
                  { key: 'stageId', value: null },
                  {
                    key: 'stageCreationDate',
                    value: null
                  }
                ],
                primaryKey: { key: 'id', value: sub },
                tableName: process.env.CHANNELS_TABLE_NAME as string
              });
            }
          }

          resolve({});
        } catch (error) {
          reject(error);
        }
      });
    }
  );

  await Promise.allSettled(deleteStagePromises);

  return;
};
