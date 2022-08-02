import { FastifyReply, FastifyRequest } from 'fastify';
import { IngestConfiguration } from '@aws-sdk/client-ivs';
import { QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, convertToAttr } from '@aws-sdk/util-dynamodb';

import { dynamoDbClient, getUserByUsername, ivsClient } from '../helpers';
import { ResponseBody } from '../../shared';
import {
  UNEXPECTED_EXCEPTION,
  USER_NOT_FOUND_EXCEPTION
} from '../../shared/constants';
import { updateIngestConfiguration } from '../../shared/helpers';

interface GetChannelDataResponseBody extends ResponseBody {
  avatar?: string;
  color?: string;
  isLive?: boolean;
  playbackUrl?: string;
  username?: string;
  ingestConfiguration?: IngestConfiguration;
}

interface GetChannelDataParams {
  channelOwnerUsername: string;
}

const handler = async (
  request: FastifyRequest<{ Params: GetChannelDataParams }>,
  reply: FastifyReply
) => {
  const { channelOwnerUsername } = request.params;
  const responseBody: GetChannelDataResponseBody = {};

  try {
    if (!channelOwnerUsername) {
      throw new Error(`Missing channelOwnerUsername: ${channelOwnerUsername}`);
    }

    // Get the user data for the channel owner from the userTable
    const { Items: UserItems } = await getUserByUsername(channelOwnerUsername);

    if (!UserItems?.length) throw new Error(USER_NOT_FOUND_EXCEPTION);

    const { avatar, channelArn, color, playbackUrl, username } = unmarshall(
      UserItems[0]
    );

    responseBody.avatar = avatar;
    responseBody.color = color;
    responseBody.playbackUrl = playbackUrl;
    responseBody.username = username;

    // Get the latest stream for this channel, if one exists
    const { Items: StreamItems } = await dynamoDbClient.send(
      new QueryCommand({
        TableName: process.env.STREAM_TABLE_NAME,
        IndexName: 'startTimeIndex',
        KeyConditionExpression: 'channelArn=:userChannelArn',
        ExpressionAttributeValues: {
          ':userChannelArn': convertToAttr(channelArn)
        },
        ProjectionExpression: 'id, endTime, ingestConfiguration',
        ScanIndexForward: false,
        Limit: 1
      })
    );

    const isLive = !!StreamItems?.length && !unmarshall(StreamItems[0]).endTime;
    responseBody.isLive = isLive;

    if (isLive) {
      let { id: streamSessionId, ingestConfiguration } = unmarshall(
        StreamItems[0]
      );

      if (!ingestConfiguration) {
        try {
          ingestConfiguration = await updateIngestConfiguration({
            channelArn,
            streamSessionId,
            ivsClient,
            dynamoDbClient
          });
        } catch (error) {
          // Missing ingest configuration or failed attempts to retrieve this data shouldn't stop the flow
        }
      }

      if (ingestConfiguration) {
        const { videoWidth, videoHeight } = ingestConfiguration.video;
        responseBody.ingestConfiguration = {
          video: { videoWidth, videoHeight }
        };
      }
    }
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  return reply.send(responseBody);
};

export default handler;
