import { UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { convertToAttr, unmarshall } from '@aws-sdk/util-dynamodb';
import { FastifyReply, FastifyRequest } from 'fastify';

import { dynamoDbClient, FollowUserRequestBody } from '../../shared/helpers';
import { getFollowingChannelArn } from './addToFollowingList';
import { getUser } from '../helpers';
import { UNEXPECTED_EXCEPTION } from '../../shared/constants';
import { UserContext } from '../authorizer';

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

    const newFollowingList = followingList.filter(
      (followingItem: string) => followingItem !== channelId
    );

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
