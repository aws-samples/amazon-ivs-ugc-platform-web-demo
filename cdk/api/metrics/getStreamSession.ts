import {
  GetStreamSessionCommand,
  IvsClient,
  StreamSession
} from '@aws-sdk/client-ivs';
import { FastifyReply, FastifyRequest } from 'fastify';

import { buildChannelArn } from '../utils/metricsHelpers';
import { UNEXPECTED_EXCEPTION } from '../utils/constants';

const ivsClient = new IvsClient({});

const handler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { params } = request;
  const { channelArnSuffix, streamSessionId } = params as {
    channelArnSuffix: string;
    streamSessionId: string;
  };
  let responseBody: Partial<StreamSession>;

  try {
    const getStreamSessionCommand = new GetStreamSessionCommand({
      channelArn: buildChannelArn(channelArnSuffix),
      streamId: streamSessionId
    });
    const { streamSession = {} } = await ivsClient.send(
      getStreamSessionCommand
    );
    const { channel, recordingConfiguration, streamId, ...rest } =
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
