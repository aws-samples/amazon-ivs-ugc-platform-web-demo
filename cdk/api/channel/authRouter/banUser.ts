import { FastifyReply, FastifyRequest } from 'fastify';
import { convertToAttr, unmarshall } from '@aws-sdk/util-dynamodb';
import { UpdateItemCommand } from '@aws-sdk/client-dynamodb';

import { dynamoDbClient, getUserByChannelArn } from '../../shared/helpers';
import { getUser } from '../helpers';
import {
  UNEXPECTED_EXCEPTION,
  BAN_USER_EXCEPTION,
  USER_NOT_FOUND_EXCEPTION
} from '../../shared/constants';
import { UserContext } from '../authorizer';

type BanUserRequestBody = { bannedChannelArn?: string };

const handler = async (
  request: FastifyRequest<{ Body: BanUserRequestBody }>,
  reply: FastifyReply
) => {
  const { sub, username: chatRoomOwnerUsername } = request.requestContext.get(
    'user'
  ) as UserContext;
  const { bannedChannelArn } = request.body;
  let chatRoomOwnerChannelArn;

  // Check input
  if (!bannedChannelArn) {
    console.error(
      `Missing bannedChannelArn for the channel owned by the user ${chatRoomOwnerUsername}`
    );

    reply.statusCode = 400;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  // Retrieve the chat room data for the requester's channel
  try {
    const { Item: UserItem = {} } = await getUser(sub);
    ({ channelArn: chatRoomOwnerChannelArn } = unmarshall(UserItem));

    // Disallow users from banning themselves from their own channel
    if (bannedChannelArn === chatRoomOwnerChannelArn) {
      console.error(
        'A user is not allowed to ban themselves from their own channel'
      );

      reply.statusCode = 400;

      return reply.send({ __type: UNEXPECTED_EXCEPTION });
    }
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

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

    // Add the bannedUserSub to the bannedUserSubs set in the user table
    const { id: bannedUserSub } = unmarshall(BannedUserItems[0]);

    await dynamoDbClient.send(
      new UpdateItemCommand({
        ExpressionAttributeValues: {
          ':bannedUserSub': convertToAttr(new Set([bannedUserSub]))
        },
        Key: { id: convertToAttr(sub) },
        UpdateExpression: 'ADD bannedUserSubs :bannedUserSub',
        TableName: process.env.CHANNELS_TABLE_NAME
      })
    );
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    return reply.send({ __type: BAN_USER_EXCEPTION });
  }

  return reply.send({});
};

export default handler;
