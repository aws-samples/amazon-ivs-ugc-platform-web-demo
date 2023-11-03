import { FastifyRequest, FastifyReply } from 'fastify';
import {
  ChannelAssetURLs,
  dynamoDbClient,
  ExtendedChannelDbRecord,
  getChannelAssetUrls,
  isFulfilled,
  StreamSessionDbRecord
} from '../../shared/helpers';
import { UNEXPECTED_EXCEPTION } from '../../shared/constants';
import { UserContext } from '../../shared/authorizer';
import { getUser } from '../helpers';
import { buildChannelArn } from '../../metrics/helpers';
import { convertToAttr, unmarshall } from '@aws-sdk/util-dynamodb';
import { QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';

type ChannelData = Omit<ExtendedChannelDbRecord, 'channelAssets'> & {
  channelAssetUrls?: ChannelAssetURLs;
};

interface GetFollowingResponseBody {
  channels?: ExtendedChannelDbRecord[];
  maxResults: number;
}

interface ChannelStatus {
  channelArn: string;
  isLive: boolean;
}

const MAX_RESULTS = 50;

const handler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { sub } = request.requestContext.get('user') as UserContext;
  let responseBody: GetFollowingResponseBody = {
    channels: [],
    maxResults: MAX_RESULTS
  };

  try {
    const { Item = {} } = await getUser(sub);
    const { followingList: channelIdList = [] } = unmarshall(Item);

    if (channelIdList.length) {
      let liveFollowedChannelStatusAndArns: ChannelStatus[] = [];
      let offlineFollowedChannelStatusAndArns: ChannelStatus[] = [];

      const followingListChannelArns = channelIdList.reduce(
        (acc: string[], channelId: string) => {
          const followingChannelArn = buildChannelArn(channelId);

          return [...acc, followingChannelArn];
        },
        [] as string[]
      );

      const followingListAttrValues = followingListChannelArns.reduce(
        (obj: {}, channelArn: string, index: boolean) => {
          return {
            ...obj,
            [`:followingListChannelArn${index}`]: convertToAttr(channelArn)
          };
        },
        {}
      );

      const { Items: followedOpenStreamSessions = [] } =
        await dynamoDbClient.send(
          new ScanCommand({
            IndexName: 'isOpenIndex',
            ProjectionExpression: 'channelArn, startTime',
            TableName: process.env.STREAM_TABLE_NAME,
            ExpressionAttributeValues: followingListAttrValues,
            FilterExpression: `channelArn IN (${Object.keys(
              followingListAttrValues
            ).toString()})`
          })
        );

      // Live Channels
      if (followedOpenStreamSessions.length) {
        const unmarshalledFollowedOpenStreamSessions: StreamSessionDbRecord[] =
          followedOpenStreamSessions.map((openStreamSession) =>
            unmarshall(openStreamSession)
          );

        const sortedFollowedOpenStreamSessions =
          unmarshalledFollowedOpenStreamSessions.sort(
            ({ startTime: startTime1 }, { startTime: startTime2 }) => {
              /* istanbul ignore else */
              if (startTime1 && startTime2) {
                return startTime1 < startTime2 ? 1 : -1; // Descending order
              } else return 0; // Adding this else case for completeness, but it is extremely unlikely that 2 events have the same timestamp
            }
          );

        liveFollowedChannelStatusAndArns = sortedFollowedOpenStreamSessions
          .reduce((acc, followedOpenStreamSessions) => {
            const { channelArn = '' } = followedOpenStreamSessions;
            return [...acc, { channelArn, isLive: true }];
          }, [] as ChannelStatus[])
          .slice(0, MAX_RESULTS);
      }

      // Offline Channels
      // Only get offline channels if returned live channels do not exceed MAX_RESULTS
      if (liveFollowedChannelStatusAndArns.length < MAX_RESULTS) {
        const followedLiveChannelArns = liveFollowedChannelStatusAndArns.map(
          (followedLiveChannelStatusAndArn) =>
            followedLiveChannelStatusAndArn.channelArn
        );
        const maxOfflineResults = MAX_RESULTS - followedLiveChannelArns.length; // Get the remaining amount of items required by MAX_RESULTS

        const followedOfflineChannelArns = followingListChannelArns
          .filter(
            (followingChannelArn: string) =>
              !followedLiveChannelArns.includes(followingChannelArn)
          )
          .slice(0, maxOfflineResults);

        offlineFollowedChannelStatusAndArns = followedOfflineChannelArns.map(
          (followedOfflineChannelArn: string) => {
            return { channelArn: followedOfflineChannelArn, isLive: false };
          }
        );
      }

      const promises = [
        ...liveFollowedChannelStatusAndArns,
        ...offlineFollowedChannelStatusAndArns
      ].map(({ channelArn, isLive = false }) => {
        return new Promise<ExtendedChannelDbRecord>(
          async (resolve, rejects) => {
            try {
              const queryCommand = new QueryCommand({
                TableName: process.env.CHANNELS_TABLE_NAME,
                IndexName: 'channelArnIndex',
                KeyConditionExpression: 'channelArn = :channelArn',
                ExpressionAttributeValues: {
                  ':channelArn': convertToAttr(channelArn)
                }
              });
              const { Items = [] } = await dynamoDbClient.send(queryCommand);
              resolve({ ...unmarshall(Items[0]), isLive });
            } catch (err) {
              console.error(err);
              rejects({});
            }
          }
        );
      });

      const unmarshalledFollowingChannelItems = (
        await Promise.allSettled(promises)
      ).reduce<ExtendedChannelDbRecord[]>((acc, promiseResult) => {
        if (isFulfilled(promiseResult)) {
          return [...acc, promiseResult.value];
        }
        return acc;
      }, []);

      responseBody.channels = unmarshalledFollowingChannelItems.reduce<
        ChannelData[]
      >((acc, channel) => {
        const { avatar, color, username, channelAssets, isLive, stageId } =
          channel;
        const channelAssetUrls = getChannelAssetUrls(channelAssets);
        return [
          ...acc,
          { avatar, color, username, channelAssetUrls, isLive, stageId }
        ];
      }, []);
    }
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  return reply.send(responseBody);
};

export default handler;
