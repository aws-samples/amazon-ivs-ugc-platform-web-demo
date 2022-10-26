import { FastifyReply, FastifyRequest } from 'fastify';
import { StreamSessionSummary } from '@aws-sdk/client-ivs';
import { unmarshall } from '@aws-sdk/util-dynamodb';

import {
  buildChannelArn,
  decryptNextToken,
  encryptNextToken,
  getStreamsByChannelArn
} from './helpers';
import { getIsLive, StreamSessionDbRecord } from '../shared/helpers';
import { UNEXPECTED_EXCEPTION } from '../shared/constants';
import { UserContext } from '../userManagement/authorizer';

interface GetStreamSessionsResponseBody {
  streamSessions?: StreamSessionSummary[];
  maxResults: number;
  nextToken?: string;
}

const STREAMS_PER_PAGE = 50;

const handler = async (
  request: FastifyRequest<{
    Querystring: { nextToken?: string };
    Params: { channelResourceId: string };
  }>,
  reply: FastifyReply
) => {
  const { sub } = request.requestContext.get('user') as UserContext;
  const { params, query } = request;
  const { channelResourceId } = params;
  let responseBody: GetStreamSessionsResponseBody;
  let nextTokenRequest;

  if (query.nextToken) {
    nextTokenRequest = decryptNextToken(query.nextToken);
  }

  try {
    const maxResults = STREAMS_PER_PAGE;
    const { LastEvaluatedKey: nextToken, Items: streamSessions = [] } =
      await getStreamsByChannelArn(
        buildChannelArn(channelResourceId),
        maxResults,
        nextTokenRequest
      );

    responseBody = {
      maxResults,
      streamSessions: streamSessions.reduce((acc, streamSession) => {
        const {
          userSub,
          endTime,
          startTime,
          id,
          truncatedEvents,
          ...rest
        }: Partial<StreamSessionDbRecord> = unmarshall(streamSession);

        if (userSub !== sub) return acc;

        return [
          ...acc,
          {
            ...rest,
            streamId: id,
            endTime: endTime ? new Date(endTime) : undefined,
            startTime: startTime ? new Date(startTime) : undefined,
            isLive: getIsLive(endTime, truncatedEvents)
          }
        ];
      }, [] as StreamSessionSummary[])
    };

    if (nextToken) {
      responseBody.nextToken = encryptNextToken(JSON.stringify(nextToken));
    }
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  return reply.send(responseBody);
};

export default handler;
