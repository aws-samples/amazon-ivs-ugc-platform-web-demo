import { FastifyReply, FastifyRequest } from 'fastify';
import {
  ChannelNotBroadcasting,
  PutMetadataCommand,
  ValidationException
} from '@aws-sdk/client-ivs';
import { unmarshall } from '@aws-sdk/util-dynamodb';

import { getUser } from '../helpers';
import { ivsClient } from '../../shared/helpers';
import {
  CHANNEL_NOT_BROADCASTING_EXCEPTION,
  TIMED_METADATA_EXCEPTION,
  TIMED_METADATA_VALIDATION_EXCEPTION,
  UNEXPECTED_EXCEPTION
} from '../../shared/constants';
import { UserContext } from '../authorizer';

type SendStreamActionRequestBody = { metadata: string };

const handler = async (
  request: FastifyRequest<{ Body: SendStreamActionRequestBody }>,
  reply: FastifyReply
) => {
  const { sub, username } = request.requestContext.get('user') as UserContext;
  const { metadata } = request.body;

  // Check input
  if (!metadata) {
    console.error(`Missing metadata payload for user: ${username}`);

    reply.statusCode = 400;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  try {
    const { Item: UserItem = {} } = await getUser(sub);
    const { channelArn } = unmarshall(UserItem);

    await ivsClient.send(new PutMetadataCommand({ channelArn, metadata }));
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    if (error instanceof ChannelNotBroadcasting) {
      return reply.send({ __type: CHANNEL_NOT_BROADCASTING_EXCEPTION });
    } else if (error instanceof ValidationException) {
      reply.statusCode = 400;

      return reply.send({
        __type: TIMED_METADATA_VALIDATION_EXCEPTION,
        message: error.message
      });
    } else return reply.send({ __type: TIMED_METADATA_EXCEPTION });
  }

  return reply.send({});
};

export default handler;
