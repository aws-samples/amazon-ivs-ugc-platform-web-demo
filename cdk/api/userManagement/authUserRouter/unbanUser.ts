import { FastifyReply, FastifyRequest } from 'fastify';
import { convertToAttr } from '@aws-sdk/util-dynamodb';
import { UpdateItemCommand } from '@aws-sdk/client-dynamodb';

import { dynamoDbClient } from '../../shared/helpers';
import {
  UNEXPECTED_EXCEPTION,
  UNBAN_USER_EXCEPTION
} from '../../shared/constants';
import { UserContext } from '../authorizer';

type BanUserRequestBody = { bannedUserId: string | undefined };

const handler = async (
  request: FastifyRequest<{ Body: BanUserRequestBody }>,
  reply: FastifyReply
) => {
  const { sub, username } = request.requestContext.get('user') as UserContext;
  const { bannedUserId } = request.body;

  // Check input
  if (!bannedUserId) {
    console.error(
      `Missing bannedUserId for the channel owned by the user ${username}`
    );

    reply.statusCode = 400;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  try {
    // Delete the bannedUserId from the bannedUsers set in the user table
    await dynamoDbClient.send(
      new UpdateItemCommand({
        ExpressionAttributeValues: {
          ':bannedUserId': convertToAttr(new Set([bannedUserId]))
        },
        Key: { id: convertToAttr(sub) },
        UpdateExpression: 'DELETE bannedUsers :bannedUserId',
        TableName: process.env.USER_TABLE_NAME
      })
    );
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    return reply.send({ __type: UNBAN_USER_EXCEPTION });
  }

  return reply.send({});
};

export default handler;
