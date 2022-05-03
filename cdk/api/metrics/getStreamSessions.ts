import {
  IvsClient,
  ListStreamSessionsCommand,
  ListStreamSessionsCommandOutput
} from '@aws-sdk/client-ivs';
import { FastifyReply, FastifyRequest } from 'fastify';

import { buildChannelArn } from '../utils/metricsHelpers';
import { UNEXPECTED_EXCEPTION } from '../utils/constants';

const ivsClient = new IvsClient({});

const handler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { params } = request;
  const { channelResourceId } = params as {
    channelResourceId: string;
  };
  const responseBody: Partial<ListStreamSessionsCommandOutput> = {
    streamSessions: []
  };

  try {
    const listStreamSessionsCommand = new ListStreamSessionsCommand({
      channelArn: buildChannelArn(channelResourceId)
    });
    const { streamSessions } = await ivsClient.send(listStreamSessionsCommand);

    responseBody.streamSessions = streamSessions;
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  return reply.send(responseBody);
};

export default handler;
