import { convertToAttr, unmarshall } from '@aws-sdk/util-dynamodb';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ScanCommand } from '@aws-sdk/client-dynamodb';

import {
  BAD_REQUEST_EXCEPTION,
  UNEXPECTED_EXCEPTION
} from '../shared/constants';
import { ChannelDbRecord, dynamoDbClient, getIsLive } from '../shared/helpers';
import { StreamSessionDbRecord } from '../shared/helpers';

interface GetChannelsResponseBody {
  channels?: Partial<ChannelDbRecord>[];
  maxResults: number;
}

interface GetChannelsQuerystring {
  isLive?: string;
}

const FILTERS = ['isLive'];
const MAX_RESULTS = 50;

const handler = async (
  request: FastifyRequest<{ Querystring: GetChannelsQuerystring }>,
  reply: FastifyReply
) => {
  const { query } = request;
  const maxResults = MAX_RESULTS;
  let responseBody: GetChannelsResponseBody = {
    channels: [],
    maxResults
  };
  const queryKeys = Object.keys(query);
  const hasValidFilter = queryKeys.some((queryKey) =>
    FILTERS.includes(queryKey)
  );

  if (!hasValidFilter) {
    reply.statusCode = 400;

    return reply.send({
      __type: BAD_REQUEST_EXCEPTION,
      message: `Missing required filter, one of: ${FILTERS.join(', ')}`
    });
  }

  if (query.isLive === 'true') {
    try {
      const scanCommand = new ScanCommand({
        IndexName: 'isOpenIndex',
        Limit: maxResults,
        ProjectionExpression: 'endTime, truncatedEvents, channelArn, startTime',
        TableName: process.env.STREAM_TABLE_NAME
      });

      const { Items: openStreamSessions = [] } = await dynamoDbClient.send(
        scanCommand
      );

      const unmarshalledStreamSessions: Partial<StreamSessionDbRecord>[] =
        openStreamSessions.map((openStreamSession) =>
          unmarshall(openStreamSession)
        );
      const sortedStreamSessions = [...unmarshalledStreamSessions].sort(
        ({ startTime: startTime1 }, { startTime: startTime2 }) => {
          /* istanbul ignore else */
          if (startTime1 && startTime2) {
            return startTime1 < startTime2 ? 1 : -1; // Descending order
          } else return 0; // Adding this else case for completeness, but it is extremely unlikely that 2 events have the same timestamp
        }
      );
      const sortedLiveChannelArns = sortedStreamSessions.reduce(
        (acc, sortedStreamSession) => {
          const {
            channelArn = '',
            endTime,
            truncatedEvents
          } = sortedStreamSession;
          const isLive = getIsLive(endTime, truncatedEvents);

          if (isLive) return [...acc, channelArn];

          return acc;
        },
        [] as string[]
      );

      if (sortedLiveChannelArns.length) {
        const channelArnKeysObject = sortedLiveChannelArns.reduce(
          (acc, channelArn, index) => ({
            ...acc,
            [`:channelArn${index}`]: convertToAttr(channelArn)
          }),
          {}
        );
        const scanCommand = new ScanCommand({
          TableName: process.env.CHANNELS_TABLE_NAME,
          IndexName: 'channelArnIndex',
          Limit: maxResults,
          FilterExpression: `channelArn IN (${Object.keys(
            channelArnKeysObject
          ).join(', ')})`,
          ExpressionAttributeValues: channelArnKeysObject
        });
        const { Items: liveChannels = [] } = await dynamoDbClient.send(
          scanCommand
        );

        const unmarshalledLiveChannels: ChannelDbRecord[] = liveChannels.map(
          (liveChannel) => unmarshall(liveChannel)
        );
        const sortedLiveChannels = [...unmarshalledLiveChannels].sort(
          ({ channelArn: channelArn1 }, { channelArn: channelArn2 }) => {
            /* istanbul ignore else */
            if (channelArn1 && channelArn2) {
              return (
                sortedLiveChannelArns.indexOf(channelArn1) -
                sortedLiveChannelArns.indexOf(channelArn2)
              );
            } else return 0;
          }
        );
        responseBody.channels = sortedLiveChannels.reduce(
          (acc, liveChannel) => {
            const { avatar, color, username } = liveChannel;

            return [...acc, { avatar, color, username }];
          },
          [] as Partial<ChannelDbRecord>[]
        );
      }
    } catch (error) {
      console.error(error);

      reply.statusCode = 500;

      return reply.send({ __type: UNEXPECTED_EXCEPTION });
    }
  }

  return reply.send(responseBody);
};

export default handler;
