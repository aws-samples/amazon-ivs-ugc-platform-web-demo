import { FastifyReply, FastifyRequest } from 'fastify';

import { getUser } from '../utils/userManagementHelpers';
import { ResponseBody } from '../utils';
import { UNEXPECTED_EXCEPTION } from '../utils/constants';
import { UserContext } from './authorizer';

interface GetUserResponseBody extends ResponseBody {
  ingestEndpoint?: string;
  playbackUrl?: string;
  streamKeyValue?: string;
  username: string;
}

const handler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { sub, username } = request.requestContext.get('user') as UserContext;
  const responseBody: GetUserResponseBody = { username };

  try {
    // Get user from userTable
    const { Item = {} } = await getUser(sub);
    const {
      ingestEndpoint: { S: ingestEndpoint },
      playbackUrl: { S: playbackUrl },
      streamKeyValue: { S: streamKeyValue }
    } = Item;

    responseBody.ingestEndpoint = ingestEndpoint;
    responseBody.streamKeyValue = streamKeyValue;
    responseBody.playbackUrl = playbackUrl;
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  return reply.send(responseBody);
};

export default handler;
