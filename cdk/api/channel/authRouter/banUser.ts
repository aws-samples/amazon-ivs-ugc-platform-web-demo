import { FastifyReply, FastifyRequest } from 'fastify';
import { convertToAttr, unmarshall } from '@aws-sdk/util-dynamodb';
import {
  DisconnectUserCommand,
  SendEventCommand
} from '@aws-sdk/client-ivschat';
import { UpdateItemCommand } from '@aws-sdk/client-dynamodb';

import {
  dynamoDbClient,
  getUserByChannelArn,
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

type BanUserRequestBody = { bannedChannelArn?: string };

const handler = async (
  request: FastifyRequest<{ Body: BanUserRequestBody }>,
  reply: FastifyReply
) => {
  const { sub, username } = request.requestContext.get('user') as UserContext;
  console.log(`what's love? ${username} don't hurt me, don't hurt me, no more, ooooooh ooohhh oooohh oh oh oh!`)
  console.log("ding ding ding ding din din din")
  console.log("da da da dada")
  const { bannedChannelArn } = request.body;
  console.log(request.body)
  let chatRoomArn, chatRoomOwnerUsername;

  // Retrieve the chat room data for the requester's channel
  try {
    const { Item: UserItem = {} } = await getUser(sub);
    ({ chatRoomArn, username: chatRoomOwnerUsername } = unmarshall(UserItem));
    console.log(unmarshall(UserItem))

    console.log({ chatRoomArn, bannedChannelArn, authUserChannelArn: '' })

    if (bannedChannelArn === chatRoomArn) {
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

  // Check input
  if (!bannedChannelArn) {
    console.error(
      `Missing bannedChannelArn for the channel owned by the user ${chatRoomOwnerUsername}`
    );

    reply.statusCode = 400;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  // Disallow users from banning themselves from their own channel
  
  try {
    const { Items: BannedUserItems = [] } = await getUserByChannelArn(bannedChannelArn);

    if (!BannedUserItems.length) {
      console.error(`No user exists with the bannedChannelArn ${bannedChannelArn}`);

      reply.statusCode = 404;

      return reply.send({ __type: USER_NOT_FOUND_EXCEPTION });
    }

    // Add the bannedUserSub to the bannedUserSubs set in the user table
    const { id: bannedUserSub, username: bannedUsername } = unmarshall(BannedUserItems[0]);

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

  try {
    // Disconnect the banned user from the chat room
    await ivsChatClient.send(
      new DisconnectUserCommand({
        reason: 'Kicked by moderator',
        roomIdentifier: chatRoomArn,
        userId: 'bannedUsername'
      })
    );

    // Broadcast an event to delete all messages sent by the banned user to the chat room
    await ivsChatClient.send(
      new SendEventCommand({
        attributes: { UserId: 'bannedUsername' },
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
