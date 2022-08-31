import { FastifyReply, FastifyRequest } from 'fastify';
import { convertToAttr } from '@aws-sdk/util-dynamodb';
import {
  DisconnectUserCommand,
  SendEventCommand
} from '@aws-sdk/client-ivschat';
import { UpdateItemCommand } from '@aws-sdk/client-dynamodb';

import {
  dynamoDbClient,
  isIvsChatError,
  ivsChatClient
} from '../../shared/helpers';
import {
  UNEXPECTED_EXCEPTION,
  BAN_USER_EXCEPTION,
  USER_NOT_FOUND_EXCEPTION
} from '../../shared/constants';
import { UserContext } from '../authorizer';
import { getUserByUsername } from '../helpers';

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

  if (bannedUserId === username) {
    console.error(
      'A user is not allowed to ban themselves from their own channel'
    );

    reply.statusCode = 400;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  try {
    const bannedUserData = await getUserByUsername(bannedUserId);
    const doesBannedUserExist = !!bannedUserData.Count;

    if (!doesBannedUserExist) {
      console.error(`No user exists with the bannedUserId ${bannedUserId}`);

      reply.statusCode = 404;

      return reply.send({ __type: USER_NOT_FOUND_EXCEPTION });
    }

    // Add the bannedUserId to the bannedUsers set in the user table
    await dynamoDbClient.send(
      new UpdateItemCommand({
        ExpressionAttributeValues: {
          ':bannedUserId': convertToAttr(new Set([bannedUserId]))
        },
        Key: { id: convertToAttr(sub) },
        UpdateExpression: 'ADD bannedUsers :bannedUserId',
        TableName: process.env.USER_TABLE_NAME
      })
    );
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    return reply.send({ __type: BAN_USER_EXCEPTION });
  }

  try {
    const userData = await getUserByUsername(username);
    const {
      chatRoomArn: { S: chatRoomArn }
    } = userData?.Items?.[0] || {};

    // Disconnect the banned user from the chat room
    await ivsChatClient.send(
      new DisconnectUserCommand({
        reason: 'Kicked by moderator',
        roomIdentifier: chatRoomArn,
        userId: bannedUserId
      })
    );

    // Broadcast an event to delete all messages sent by the banned user to the chat room
    await ivsChatClient.send(
      new SendEventCommand({
        attributes: { userId: bannedUserId },
        eventName: 'app:DELETE_USER_MESSAGES',
        roomIdentifier: chatRoomArn
      })
    );
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    if (isIvsChatError(error)) {
      return reply.send({ __type: error.name });
    }

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  return reply.send({});
};

export default handler;
