import { convertToAttr, unmarshall } from '@aws-sdk/util-dynamodb';
import { FastifyReply, FastifyRequest } from 'fastify';
import { QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';

import {
  BAD_REQUEST_EXCEPTION,
  UNEXPECTED_EXCEPTION
} from '../shared/constants';
import {
  ChannelAssetURLs,
  ChannelDbRecord,
  dynamoDbClient,
  getChannelAssetUrls,
  getIsLive,
  isFulfilled,
  StreamSessionDbRecord
} from '../shared/helpers';

type ChannelData = Omit<ChannelDbRecord, 'channelAssets'> & {
  channelAssetUrls?: ChannelAssetURLs;
};

interface GetChannelsResponseBody {
  channels?: ChannelData[];
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
      const scanStreamTableCommand = new ScanCommand({
        IndexName: 'isOpenIndex',
        ProjectionExpression: 'endTime, truncatedEvents, channelArn, startTime',
        TableName: process.env.STREAM_TABLE_NAME
      });

      const scanChannelTableForActiveStageCommand = new ScanCommand({
        TableName: process.env.CHANNELS_TABLE_NAME,
        FilterExpression:
          'attribute_exists(stageId) AND #stageId <> :nullValue',
        ExpressionAttributeNames: {
          '#stageId': 'stageId'
        },
        ExpressionAttributeValues: {
          ':nullValue': { NULL: true }
        }
      });

      const [activeStreamSessionsResult, activeStageSessionsResult] =
        await Promise.allSettled([
          dynamoDbClient.send(scanStreamTableCommand),
          dynamoDbClient.send(scanChannelTableForActiveStageCommand)
        ]);

      if (
        activeStageSessionsResult.status === 'rejected' ||
        activeStreamSessionsResult.status === 'rejected'
      ) {
        throw new Error('Something went wrong');
      }

      const { Items: activeStageSessions } = activeStageSessionsResult.value;
      const { Items: activeStreamSessions } = activeStreamSessionsResult.value;

      const unmarshalledActiveStageSessions: ChannelDbRecord[] = (
        activeStageSessions || []
      ).map((activeStageSession) => unmarshall(activeStageSession));

      const unmarshalledStreamSessions: StreamSessionDbRecord[] = (
        activeStreamSessions || []
      ).map((activeStreamSession) => unmarshall(activeStreamSession));

      const sortedActiveStageSessions = unmarshalledActiveStageSessions
        .sort(
          (
            { stageCreationDate: stageCreationDate1 },
            { stageCreationDate: stageCreationDate2 }
          ) => {
            /* istanbul ignore else */
            if (stageCreationDate1 && stageCreationDate2) {
              return stageCreationDate1 < stageCreationDate2 ? 1 : -1; // Descending order
            } else return 0; // Adding this else case for completeness, but it is extremely unlikely that 2 events have the same timestamp
          }
        )
        .slice(0, maxResults);

      const sortedStreamSessions = unmarshalledStreamSessions
        .sort(({ startTime: startTime1 }, { startTime: startTime2 }) => {
          /* istanbul ignore else */
          if (startTime1 && startTime2) {
            return startTime1 < startTime2 ? 1 : -1; // Descending order
          } else return 0; // Adding this else case for completeness, but it is extremely unlikely that 2 events have the same timestamp
        })
        .slice(0, maxResults);
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

      if (sortedLiveChannelArns.length || sortedActiveStageSessions.length) {
        const promises = sortedLiveChannelArns.map((liveChannelArn) => {
          return new Promise<ChannelDbRecord>(async (resolve, rejects) => {
            try {
              const queryCommand = new QueryCommand({
                TableName: process.env.CHANNELS_TABLE_NAME,
                IndexName: 'channelArnIndex',
                KeyConditionExpression: 'channelArn = :channelArn',
                ExpressionAttributeValues: {
                  ':channelArn': convertToAttr(liveChannelArn)
                }
              });

              /* istanbul ignore next */
              const { Items = [] } = await dynamoDbClient.send(queryCommand);
              resolve(unmarshall(Items[0]));
            } catch (err) {
              console.error(err);

              rejects({});
            }
          });
        });

        const unmarshalledLiveChannels = (
          await Promise.allSettled(promises)
        ).reduce<ChannelDbRecord[]>((acc, promiseResult) => {
          if (isFulfilled(promiseResult)) {
            return [...acc, promiseResult.value];
          }
          return acc;
        }, []);

        const combinedLiveChannelsAndActiveStages = [
          ...unmarshalledLiveChannels,
          ...sortedActiveStageSessions
        ];

        responseBody.channels = combinedLiveChannelsAndActiveStages.reduce<
          ChannelData[]
        >((acc, liveChannel) => {
          const { avatar, color, username, channelAssets } = liveChannel;
          const channelAssetUrls = getChannelAssetUrls(channelAssets!);

          return [...acc, { avatar, color, username, channelAssetUrls }];
        }, []);
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
