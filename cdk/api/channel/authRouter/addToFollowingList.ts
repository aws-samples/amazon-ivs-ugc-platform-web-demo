import { UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { convertToAttr, unmarshall } from '@aws-sdk/util-dynamodb';
import { FastifyReply, FastifyRequest } from 'fastify';

import {
  BAD_REQUEST_EXCEPTION,
  FOLLOWING_LIST_DUPLICATE_EXCEPTION,
  UNEXPECTED_EXCEPTION,
  USER_NOT_FOUND_EXCEPTION
} from '../../shared/constants';
import { dynamoDbClient, FollowUserRequestBody } from '../../shared/helpers';
import { getUser, getUserByUsername } from '../helpers';
import { UserContext } from '../authorizer';

export const getFollowingChannelArn = async ({
  reply,
  followedUsername,
  sub
}: {
  reply: FastifyReply;
  followedUsername: string;
  sub: string;
}) => {
  // Validate followed username
  if (!followedUsername) {
    console.error('Missing followedUsername for the channel');

    reply.statusCode = 400;

    return reply.send({ __type: BAD_REQUEST_EXCEPTION });
  }

  const { Items: FollowUserItems = [] } = await getUserByUsername(
    followedUsername
  );

  if (!FollowUserItems.length) {
    console.error(
      `No user exists with the followedUsername ${followedUsername}`
    );

    reply.statusCode = 404;

    return reply.send({ __type: USER_NOT_FOUND_EXCEPTION });
  }

  const { channelArn: followingChannelArn, id: followId } = unmarshall(
    FollowUserItems[0]
  );

  if (followId === sub) {
    console.error('Follower sub cannot be the same as user sub');

    reply.statusCode = 400;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  return followingChannelArn;
};

const handler = async (
  request: FastifyRequest<{
    Body: FollowUserRequestBody;
  }>,
  reply: FastifyReply
) => {
  const { sub } = request.requestContext.get('user') as UserContext;
  const { followedUsername } = request.body;

  try {
    const followingChannelArn = await getFollowingChannelArn({
      reply,
      followedUsername,
      sub
    });

    const channelId = followingChannelArn.split(':channel/')[1];
    const { Item: UserItem = {} } = await getUser(sub);
    const { followingList = [] } = unmarshall(UserItem);

    if (followingList.includes(channelId)) {
      console.error('Channel already exists in following list');

      reply.statusCode = 400;

      return reply.send({ __type: FOLLOWING_LIST_DUPLICATE_EXCEPTION });
    }

    const newFollowingList = [].concat(channelId, followingList);

    await dynamoDbClient.send(
      new UpdateItemCommand({
        ExpressionAttributeValues: {
          ':newFollowingList': convertToAttr(newFollowingList)
        },
        Key: { id: convertToAttr(sub) },
        UpdateExpression: 'SET followingList = :newFollowingList',
        TableName: process.env.CHANNELS_TABLE_NAME
      })
    );
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  return reply.send({});
};

export default handler;
