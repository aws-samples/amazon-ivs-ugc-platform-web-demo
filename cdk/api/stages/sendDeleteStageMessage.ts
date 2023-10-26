import { FastifyReply, FastifyRequest } from 'fastify';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { UNEXPECTED_EXCEPTION } from '../shared/constants';

type DeleteStageMessageRequestBody = {
  stageId?: string;
  stageArn?: string;
  sessionId?: string;
  userId?: string;
};

const sqsClient = new SQSClient();

const handler = async (
  request: FastifyRequest<{ Body: DeleteStageMessageRequestBody }>,
  reply: FastifyReply
) => {
  const { stageId, sessionId, stageArn, userId } = request.body;

  try {
    if (!stageArn && !stageId)
      throw new Error(
        'A stageArn or stageID is required in order to delete a stage'
      );

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
      MessageBody: messageBody
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
