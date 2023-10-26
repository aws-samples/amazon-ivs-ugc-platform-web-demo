import { convertToAttr, unmarshall } from '@aws-sdk/util-dynamodb';
import { FastifyReply, FastifyRequest } from 'fastify';
import { UpdateItemCommand } from '@aws-sdk/client-dynamodb';

import { dynamoDbClient, getUserByChannelArn } from '../../shared/helpers';
import {
  UNBAN_USER_EXCEPTION,
  UNEXPECTED_EXCEPTION,
  USER_NOT_FOUND_EXCEPTION
} from '../../shared/constants';
import { UserContext } from '../../shared/authorizer';

type BanUserRequestBody = { bannedChannelArn?: string };

const handler = async (
  request: FastifyRequest<{ Body: BanUserRequestBody }>,
  reply: FastifyReply
) => {
  const { sub, username } = request.requestContext.get('user') as UserContext;
  const { bannedChannelArn } = request.body;

  // Check input
  if (!bannedChannelArn) {
    console.error(
      `Missing bannedUsername for the channel owned by the user ${username}`
    );

    reply.statusCode = 400;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  try {
    const { Items: BannedUserItems = [] } = await getUserByChannelArn(
      bannedChannelArn
    );

    if (!BannedUserItems.length) {
      console.error(
        `No user exists with the bannedChannelArn ${bannedChannelArn}`
      );

      reply.statusCode = 404;

      return reply.send({ __type: USER_NOT_FOUND_EXCEPTION });
    }

    // Delete the bannedUserSub from the bannedUserSubs set in the user table
    const { id: bannedUserSub } = unmarshall(BannedUserItems[0]);

    await dynamoDbClient.send(
      new UpdateItemCommand({
        ExpressionAttributeValues: {
          ':bannedUserSub': convertToAttr(new Set([bannedUserSub]))
        },
        Key: { id: convertToAttr(sub) },
        UpdateExpression: 'DELETE bannedUserSubs :bannedUserSub',
        TableName: process.env.CHANNELS_TABLE_NAME
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
