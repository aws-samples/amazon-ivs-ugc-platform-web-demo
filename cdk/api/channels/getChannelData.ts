import { FastifyReply, FastifyRequest } from 'fastify';
import { IngestConfiguration } from '@aws-sdk/client-ivs';
import { QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, convertToAttr } from '@aws-sdk/util-dynamodb';

import {
  UNAUTHORIZED_EXCEPTION,
  UNEXPECTED_EXCEPTION,
  USER_NOT_FOUND_EXCEPTION
} from '../shared/constants';
import {
  ChannelAssetURLs,
  dynamoDbClient,
  getChannelAssetUrls,
  getChannelId,
  getIsLive,
  ResponseBody,
  updateIngestConfiguration
} from '../shared/helpers';
import { getUser, getUserByUsername } from '../channel/helpers';
import { StreamSessionDbRecord } from '../shared/helpers';
import authorizer from '../channel/authorizer';

interface GetChannelDataResponseBody extends ResponseBody {
  avatar?: string;
  channelAssetUrls?: ChannelAssetURLs;
  color?: string;
  ingestConfiguration?: IngestConfiguration;
  isChannelBanned?: boolean;
  isLive?: boolean;
  isViewerBanned?: boolean;
  isViewerFollowing?: boolean;
  playbackUrl?: string;
  username?: string;
}

interface GetChannelDataParams {
  channelOwnerUsername: string;
}

const handler = async (
  request: FastifyRequest<{ Params: GetChannelDataParams }>,
  reply: FastifyReply
) => {
  const { channelOwnerUsername } = request.params; // chatRoomOwnerUsername is case sensitive
  const responseBody: GetChannelDataResponseBody = {};
  let viewerSub;

  try {
    const { authorization: authorizationToken } = request.headers;
    const isAuthRequest = !!authorizationToken;

    if (isAuthRequest) {
      ({ sub: viewerSub } = await authorizer(request));
    }
  } catch (error) {
    console.error(error);

    reply.statusCode = 401;

    return reply.send({ __type: UNAUTHORIZED_EXCEPTION });
  }

  try {
    if (!channelOwnerUsername) {
      throw new Error(`Missing channelOwnerUsername: ${channelOwnerUsername}`);
    }

    // Get the user data for the channel owner from the channelsTable
    const { Items: UserItems } = await getUserByUsername(channelOwnerUsername);

    if (!UserItems?.length) throw new Error(USER_NOT_FOUND_EXCEPTION);

    const {
      avatar,
      bannedUserSubs,
      channelArn,
      channelAssets,
      color,
      playbackUrl,
      username,
      id: channelSub
    } = unmarshall(UserItems[0]);

    responseBody.avatar = avatar;
    responseBody.color = color;
    responseBody.username = username;
    responseBody.isViewerBanned = false;
    responseBody.isChannelBanned = false;
    responseBody.isViewerFollowing = false;
    responseBody.channelAssetUrls = getChannelAssetUrls(channelAssets);

    if (viewerSub) {
      try {
        const channelId = getChannelId(channelArn);
        const { Item: ViewerItem = {} } = await getUser(viewerSub);
        const {
          followingList: viewerFollowingList = [],
          bannedUserSubs: viewerBannedUserSubsSet = new Set([])
        } = unmarshall(ViewerItem);

        // Check if the channel is banned by the authorized user
        responseBody.isChannelBanned = viewerBannedUserSubsSet?.has(channelSub);

        // Check if the channel is being followed by the viewer
        responseBody.isViewerFollowing =
          viewerFollowingList.includes(channelId);
      } catch (error) {
        /**
         * If we cannot retrieve information about the channel being banned by the viewer,
         * or about the viewer following the channel, then we will continue to serve the
         * reamining data that can be retrieved.
         */
      }

      // If the viewer is banned, then return early with only a subset of the channel data
      if (bannedUserSubs?.has(viewerSub)) {
        responseBody.isViewerBanned = true;

        return reply.send(responseBody);
      }
    }

    // Get the latest stream for this channel, if one exists
    const { Items: StreamItems } = await dynamoDbClient.send(
      new QueryCommand({
        TableName: process.env.STREAM_TABLE_NAME,
        IndexName: 'startTimeIndex',
        KeyConditionExpression: 'channelArn=:userChannelArn',
        ExpressionAttributeValues: {
          ':userChannelArn': convertToAttr(channelArn)
        },
        ProjectionExpression:
          'id, endTime, ingestConfiguration, truncatedEvents',
        ScanIndexForward: false,
        Limit: 1
      })
    );
    let isLive = false;

    if (!!StreamItems?.length) {
      const unmarshalledItem: Partial<StreamSessionDbRecord> = unmarshall(
        StreamItems[0]
      );

      const {
        endTime,
        id: streamSessionId,
        truncatedEvents
      } = unmarshalledItem;
      let { ingestConfiguration } = unmarshalledItem;

      // isLive is true only when playback is available, i.e. after the 'Stream Start' event is dispatched
      isLive = getIsLive(endTime, truncatedEvents);

      if (isLive) {
        if (!ingestConfiguration && streamSessionId) {
          try {
            ingestConfiguration = await updateIngestConfiguration({
              channelArn,
              streamSessionId
            });
          } catch (error) {
            // Missing ingest configuration or failed attempts to retrieve this data shouldn't stop the flow
          }
        }

        if (ingestConfiguration?.video) {
          const { videoWidth, videoHeight } = ingestConfiguration.video;
          responseBody.ingestConfiguration = {
            video: { videoWidth, videoHeight }
          };
        }
      }
    }

    responseBody.isLive = isLive;
    responseBody.playbackUrl = playbackUrl;
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  return reply.send(responseBody);
};

export default handler;
