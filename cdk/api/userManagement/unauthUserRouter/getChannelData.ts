import { FastifyReply, FastifyRequest } from 'fastify';
import { IngestConfiguration } from '@aws-sdk/client-ivs';
import { QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, convertToAttr } from '@aws-sdk/util-dynamodb';

import { getUserByUsername } from '../helpers';
import {
  UNAUTHORIZED_EXCEPTION,
  UNEXPECTED_EXCEPTION,
  USER_NOT_FOUND_EXCEPTION
} from '../../shared/constants';
import {
  dynamoDbClient,
  ResponseBody,
  updateIngestConfiguration
} from '../../shared/helpers';
import { StreamSessionDbRecord } from '../../shared/helpers';
import authorizer from '../authorizer';

interface GetChannelDataResponseBody extends ResponseBody {
  avatar?: string;
  color?: string;
  isLive?: boolean;
  playbackUrl?: string;
  username?: string;
  ingestConfiguration?: IngestConfiguration;
  isViewerBanned?: boolean;
}

interface GetChannelDataParams {
  channelOwnerUsername: string;
}

const STREAM_START = 'Stream Start';

const handler = async (
  request: FastifyRequest<{ Params: GetChannelDataParams }>,
  reply: FastifyReply
) => {
  const { channelOwnerUsername } = request.params;
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

    // Get the user data for the channel owner from the userTable
    const { Items: UserItems } = await getUserByUsername(channelOwnerUsername);

    if (!UserItems?.length) throw new Error(USER_NOT_FOUND_EXCEPTION);

    const { avatar, bannedUserSubs, channelArn, color, playbackUrl, username } =
      unmarshall(UserItems[0]);

    responseBody.avatar = avatar;
    responseBody.color = color;
    responseBody.username = username;
    responseBody.isViewerBanned = false;

    // If the viewer is banned, then only return a subset of the channel data
    if (viewerSub && bannedUserSubs) {
      if (bannedUserSubs.has(viewerSub)) {
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
      isLive =
        !endTime &&
        !!truncatedEvents?.find(
          (truncatedEvent) => truncatedEvent.name === STREAM_START
        );

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
