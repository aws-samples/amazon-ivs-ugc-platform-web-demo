import { FastifyReply, FastifyRequest } from 'fastify';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import {
  MESSAGE_GROUP_IDS,
  UNEXPECTED_EXCEPTION,
  USER_NOT_FOUND_EXCEPTION
} from '../../shared/constants';
import { buildStageArn, createHostUserIdFromChannelArn } from '../helpers';
import { getStage } from '../helpers';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { getUserByChannelArn } from '../../shared/helpers';
import { buildChannelArn } from '../../metrics/helpers';

type HostDisconnectedMessageRequestBody = {
  hostChannelId: string;
  stageId: string;
};

const sqsClient = new SQSClient();

const handler = async (
  request: FastifyRequest<{ Body: HostDisconnectedMessageRequestBody }>,
  reply: FastifyReply
) => {
  let hostChannelId, stageId;

  if (typeof request.body === 'object') {
    hostChannelId = request.body.hostChannelId;
    stageId = request.body.stageId;
  }

  // From Beacon API (JSON string)
  if (typeof request.body === 'string') {
    const parsedBody = JSON.parse(request?.body);
    const channelId = parsedBody.hostChannelId;
    const bodyStageId = parsedBody.stageId;

    if (!hostChannelId && channelId) {
      hostChannelId = channelId;
    }
    if (!stageId && bodyStageId) {
      stageId = bodyStageId;
    }
  }

  if (!hostChannelId)
    throw new Error(
      'Channel id of host is required in order to delete a stage'
    );

  try {
    const hostChannelArn = buildChannelArn(hostChannelId);
    const { Items: UserItems } = await getUserByChannelArn(hostChannelArn);
    if (!UserItems?.length) throw new Error(USER_NOT_FOUND_EXCEPTION);

    const { stageId: recordedStageId, channelArn } = unmarshall(UserItems[0]);

    if (!stageId && recordedStageId) {
      stageId = recordedStageId;
    }

    if (!stageId && recordedStageId) {
      stageId = recordedStageId;
    }

    const stageArn = buildStageArn(stageId);

    if (!stageArn && !stageId)
      throw new Error(
        'A stageArn or stageID is required in order to delete a stage'
      );

    const userId = createHostUserIdFromChannelArn(channelArn);
    const { stage } = await getStage(stageId, channelArn);
    const sessionId = stage?.activeSessionId;

    const messageParts = [];
    if (stageId) {
      messageParts.push(`"stageId": "${stageId}"`);
    }
    if (stageArn) {
      messageParts.push(`"stageArn": "${stageArn}"`);
    }
    if (sessionId) {
      messageParts.push(`"sessionId": "${sessionId}"`);
    }
    if (userId) {
      messageParts.push(`"userId": "${userId}"`);
    }
    const messageBody = `{ ${messageParts.join(', ')} }`;

    const input = {
      QueueUrl: process.env.SQS_DELETE_STAGE_QUEUE_URL,
      MessageBody: messageBody,
      MessageGroupId: MESSAGE_GROUP_IDS.DELETE_STAGE_MESSAGE
    };
    const command = new SendMessageCommand(input);
    const response = await sqsClient.send(command);

    reply.statusCode = 200;
    return reply.send(response);
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;
    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }
};

export default handler;
