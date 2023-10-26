import { FastifyReply, FastifyRequest } from 'fastify';
import { unmarshall } from '@aws-sdk/util-dynamodb';

import { getChannelArnParams, getUser } from '../helpers';
import {
  ChannelAssetURLs,
  getChannelAssetUrls,
  ResponseBody
} from '../../shared/helpers';
import { UNEXPECTED_EXCEPTION } from '../../shared/constants';
import { UserContext } from '../../shared/authorizer';

interface GetUserResponseBody extends ResponseBody {
  avatar?: string;
  channelAssetUrls?: ChannelAssetURLs;
  channelResourceId?: string;
  color?: string;
  ingestEndpoint?: string;
  ingestServerUrl?: string;
  playbackUrl?: string;
  streamKeyValue?: string;
  username?: string;
  trackingId?: string;
}

const handler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { sub } = request.requestContext.get('user') as UserContext;
  const responseBody: GetUserResponseBody = {};

  try {
    // Get user from channelsTable
    const { Item = {} } = await getUser(sub);
    const {
      avatar,
      channelArn,
      channelAssets,
      color,
      ingestEndpoint,
      playbackUrl,
      streamKeyValue,
      username,
      trackingId
    } = unmarshall(Item);

    if (!channelArn) {
      throw new Error('No IVS resources have been created for this user.');
    }

    if (channelArn) {
      responseBody.channelResourceId =
        getChannelArnParams(channelArn).resourceId;
    }
    responseBody.avatar = avatar;
    responseBody.color = color;
    responseBody.ingestEndpoint = ingestEndpoint;
    responseBody.ingestServerUrl = `rtmps://${ingestEndpoint}:443/app/`;
    responseBody.playbackUrl = playbackUrl;
    responseBody.streamKeyValue = streamKeyValue;
    responseBody.username = username;
    responseBody.channelAssetUrls = getChannelAssetUrls(channelAssets);
    responseBody.trackingId = trackingId;
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  return reply.send(responseBody);
};

export default handler;
