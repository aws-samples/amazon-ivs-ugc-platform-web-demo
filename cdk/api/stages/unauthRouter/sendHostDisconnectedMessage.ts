import { FastifyReply, FastifyRequest } from 'fastify';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { UNEXPECTED_EXCEPTION, USER_NOT_FOUND_EXCEPTION } from '../../shared/constants';
import { buildStageArn, generateHostUserId } from '../helpers';
import { getStage } from '../helpers';
import { getUserByUsername } from '../../channel/helpers';
import { unmarshall } from '@aws-sdk/util-dynamodb';

type HostDisconnectedMessageRequestBody = {
  hostUsername?: string;
}

const sqsClient = new SQSClient();

const handler = async (
  request: FastifyRequest<{ Body: HostDisconnectedMessageRequestBody }>,
  reply: FastifyReply
) => {
  const { hostUsername = '' } = request.body;

  if (!hostUsername) throw new Error('Username of host is required in order to delete a stage')

  try {
    const { Items: UserItems } = await getUserByUsername(hostUsername)
  
    if (!UserItems?.length) throw new Error(USER_NOT_FOUND_EXCEPTION);
  
    const {
      stageId,
      channelArn
    } = unmarshall(UserItems[0]);
  
    const stageArn = buildStageArn(stageId);

    if (!stageArn && !stageId)
      throw new Error(
        'A stageArn or stageID is required in order to delete a stage'
      );

    const userId = generateHostUserId(channelArn)
    const { stage } = await getStage(stageId)
    const sessionId = stage?.activeSessionId
        
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
    if (sessionId) {
      messageParts.push(`"userId": "${userId}"`);
    }
    const messageBody = `{ ${messageParts.join(', ')} }`;

    const input = {
      QueueUrl: process.env.SQS_DELETE_STAGE_QUEUE_URL,
      MessageBody: messageBody,
      MessageGroupId: stageId
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
