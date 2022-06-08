import {
  IvsClient,
  ListStreamSessionsCommand,
  ListStreamSessionsCommandOutput
} from '@aws-sdk/client-ivs';
import { FastifyReply, FastifyRequest } from 'fastify';

import { buildChannelArn } from '../utils/metricsHelpers';
import { UNEXPECTED_EXCEPTION } from '../utils/constants';

interface GetStreamSessionsBody
  extends Partial<ListStreamSessionsCommandOutput> {
  maxResults: number;
}

interface GetStreamSessionsQueryString {
  nextToken?: string;
}

const STREAMS_PER_PAGE = 50;

export const ivsClient = new IvsClient({});

const handler = async (
  request: FastifyRequest<{
    Querystring: GetStreamSessionsQueryString | null;
  }>,
  reply: FastifyReply
) => {
  const { params, query } = request;
  const { channelResourceId } = params as {
    channelResourceId: string;
  };
  let responseBody: GetStreamSessionsBody;
  let nextTokenRequest;

  if (query) {
    nextTokenRequest = query.nextToken;
  }

  try {
    const maxResults = STREAMS_PER_PAGE;
    const listStreamSessionsCommand = new ListStreamSessionsCommand({
      channelArn: buildChannelArn(channelResourceId),
      maxResults,
      nextToken: nextTokenRequest
    });
    const { nextToken, streamSessions = [] } = await ivsClient.send(
      listStreamSessionsCommand
    );

    responseBody = { maxResults, streamSessions };

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
