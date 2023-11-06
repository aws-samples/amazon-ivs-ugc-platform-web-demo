import { GetStreamCommand, ChannelNotBroadcasting } from '@aws-sdk/client-ivs';
import { FastifyReply, FastifyRequest } from 'fastify';

import { getUser } from '../helpers';
import { UNEXPECTED_EXCEPTION } from '../../shared/constants';
import { ivsClient, ResponseBody } from '../../shared/helpers';
import { UserContext } from '../../shared/authorizer';

interface GetStreamLiveStatusResponseBody extends ResponseBody {
  isLive?: Boolean;
}

const handler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { sub } = request.requestContext.get('user') as UserContext;
  const responseBody: GetStreamLiveStatusResponseBody = {};

  try {
    const { Item = {} } = await getUser(sub);
    const {
      channelArn: { S: channelArn }
    } = Item;

    try {
      const getStreamCommand = new GetStreamCommand({ channelArn });
      const response = await ivsClient.send(getStreamCommand);
      const streamStatus = response?.stream?.state;

      if (streamStatus === 'LIVE') {
        responseBody.isLive = true;
      }
    } catch (error) {
      if (error instanceof ChannelNotBroadcasting) {
        responseBody.isLive = false;
      } else {
        throw error;
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
