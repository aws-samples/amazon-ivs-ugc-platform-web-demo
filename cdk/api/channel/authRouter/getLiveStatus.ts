import { GetStreamCommand, ChannelNotBroadcasting } from '@aws-sdk/client-ivs';
import { FastifyReply, FastifyRequest } from 'fastify';

import { getUser } from '../helpers';
import { UNEXPECTED_EXCEPTION } from '../../shared/constants';
import { ivsClient, ResponseBody } from '../../shared/helpers';
import { UserContext } from '../../shared/authorizer';
import { unmarshall } from '@aws-sdk/util-dynamodb';

interface GetLiveStatusResponseBody extends ResponseBody {
  isStageActive?: Boolean;
  isBroadcasting?: Boolean;
}

const handler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { sub } = request.requestContext.get('user') as UserContext;
  const responseBody: GetLiveStatusResponseBody = {};

  try {
    const { Item = {} } = await getUser(sub);
    const { channelArn, stageId } = unmarshall(Item)

    responseBody.isStageActive = !!stageId

    try {
      const getStreamCommand = new GetStreamCommand({ channelArn });
      const response = await ivsClient.send(getStreamCommand);
      const streamStatus = response?.stream?.state;

      if (streamStatus === 'LIVE') {
        responseBody.isBroadcasting = true;
      }
    } catch (error) {
      if (error instanceof ChannelNotBroadcasting) {
        responseBody.isBroadcasting = false;
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
