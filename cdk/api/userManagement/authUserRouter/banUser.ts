import { FastifyReply, FastifyRequest } from 'fastify';
import { convertToAttr, unmarshall } from '@aws-sdk/util-dynamodb';
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
import { getUser, getUserByUsername } from '../helpers';
import {
  UNEXPECTED_EXCEPTION,
  BAN_USER_EXCEPTION,
  USER_NOT_FOUND_EXCEPTION
} from '../../shared/constants';
import { UserContext } from '../authorizer';

type BanUserRequestBody = { bannedUsername?: string };

const handler = async (
  request: FastifyRequest<{ Body: BanUserRequestBody }>,
  reply: FastifyReply
) => {
  const { sub } = request.requestContext.get('user') as UserContext;
  const { bannedUsername } = request.body; // bannedUsername is case sensitive
  let chatRoomArn, chatRoomOwnerUsername;

  // Retrieve the chat room data for the requester's channel
  try {
    const { Item: UserItem = {} } = await getUser(sub);
    ({ chatRoomArn, username: chatRoomOwnerUsername } = unmarshall(UserItem));
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  // Check input
  if (!bannedUsername) {
    console.error(
      `Missing bannedUsername for the channel owned by the user ${chatRoomOwnerUsername}`
    );

    reply.statusCode = 400;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  // Disallow users from banning themselves from their own channel
  if (bannedUsername === chatRoomOwnerUsername) {
    console.error(
      'A user is not allowed to ban themselves from their own channel'
    );

    reply.statusCode = 400;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  try {
    const { Items: BannedUserItems = [] } = await getUserByUsername(
      bannedUsername
    );

    if (!BannedUserItems.length) {
      console.error(`No user exists with the bannedUsername ${bannedUsername}`);

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
        TableName: process.env.USER_TABLE_NAME
      })
    );
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    return reply.send({ __type: BAN_USER_EXCEPTION });
  }

  try {
    // Disconnect the banned user from the chat room
    await ivsChatClient.send(
      new DisconnectUserCommand({
        reason: 'Kicked by moderator',
        roomIdentifier: chatRoomArn,
        userId: bannedUsername
      })
    );

    // Broadcast an event to delete all messages sent by the banned user to the chat room
    await ivsChatClient.send(
      new SendEventCommand({
        attributes: { UserId: bannedUsername },
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
