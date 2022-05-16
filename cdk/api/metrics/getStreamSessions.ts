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
  const { params, query } = request;
  const { channelResourceId } = params as {
    channelResourceId: string;
  };
  const { nextToken: nextTokenRequest } = query as {
    nextToken: string;
  };
  let responseBody: Partial<ListStreamSessionsCommandOutput>;

  try {
    const listStreamSessionsCommand = new ListStreamSessionsCommand({
      channelArn: buildChannelArn(channelResourceId),
      nextToken: nextTokenRequest
    });
    const { nextToken, streamSessions = [] } = await ivsClient.send(
      listStreamSessionsCommand
    );

    responseBody = { streamSessions };

    if (nextToken) {
      responseBody.nextToken = encodeURIComponent(nextToken);
    }
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  return reply.send(responseBody);
};

export default handler;
