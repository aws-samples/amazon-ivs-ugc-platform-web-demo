import { FastifyReply, FastifyRequest } from 'fastify';
import { StreamSession } from '@aws-sdk/client-ivs';

import { buildChannelArn, getStreamSession } from '../utils/metricsHelpers';
import { UNEXPECTED_EXCEPTION } from '../utils/constants';

const handler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { params } = request;
  const { channelResourceId, streamSessionId } = params as {
    channelResourceId: string;
    streamSessionId: string;
  };
  let responseBody: Partial<StreamSession>;

  try {
    const { streamSession = {} } = await getStreamSession(
      buildChannelArn(channelResourceId),
      streamSessionId
    );
    const { channel, recordingConfiguration, ...rest } =
      streamSession as StreamSession;

    responseBody = rest;
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  return reply.send(responseBody);
};

export default handler;
