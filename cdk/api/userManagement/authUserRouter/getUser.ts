import { FastifyReply, FastifyRequest } from 'fastify';

import { getChannelArnParams, getUser } from '../helpers';
import { ResponseBody } from '../../utils';
import { UNEXPECTED_EXCEPTION } from '../../utils/constants';
import { UserContext } from '../authorizer';

interface GetUserResponseBody extends ResponseBody {
  channelResourceId?: string;
  ingestEndpoint?: string;
  playbackUrl?: string;
  streamKeyValue?: string;
  username?: string;
}

const handler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { sub } = request.requestContext.get('user') as UserContext;
  const responseBody: GetUserResponseBody = {};

  try {
    // Get user from userTable
    const { Item = {} } = await getUser(sub);
    const {
      channelArn: { S: channelArn },
      ingestEndpoint: { S: ingestEndpoint },
      playbackUrl: { S: playbackUrl },
      streamKeyValue: { S: streamKeyValue },
      username: { S: username }
    } = Item;

    if (channelArn) {
      responseBody.channelResourceId =
        getChannelArnParams(channelArn).resourceId;
    }
    responseBody.ingestEndpoint = ingestEndpoint;
    responseBody.playbackUrl = playbackUrl;
    responseBody.streamKeyValue = streamKeyValue;
    responseBody.username = username;
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  return reply.send(responseBody);
};

export default handler;
