import { FastifyReply, FastifyRequest } from 'fastify';

import { ChatTokenCapabilityType, createChatRoomToken } from '../helpers';
import { ResponseBody } from '../../shared/helpers';
import { UNEXPECTED_EXCEPTION } from '../../shared/constants';

type CreatePublicChatTokenRequestBody = { chatRoomOwnerUsername: string };

interface CreatePublicChatTokenResponseBody extends ResponseBody {
  token?: string;
  sessionExpirationTime?: Date;
  tokenExpirationTime?: Date;
  capabilities: ChatTokenCapabilityType[];
}

const handler = async (
  request: FastifyRequest<{ Body: CreatePublicChatTokenRequestBody }>,
  reply: FastifyReply
) => {
  const { chatRoomOwnerUsername } = request.body; // chatRoomOwnerUsername is case sensitive
  const responseBody: CreatePublicChatTokenResponseBody = {
    capabilities: ['VIEW_MESSAGE']
  };

  // Check input
  if (!chatRoomOwnerUsername) {
    reply.statusCode = 400;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  try {
    const result = await createChatRoomToken(chatRoomOwnerUsername);
    const { token, sessionExpirationTime, tokenExpirationTime } = result;
    responseBody.token = token;
    responseBody.sessionExpirationTime = sessionExpirationTime;
    responseBody.tokenExpirationTime = tokenExpirationTime;
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  reply.statusCode = 200;

  return reply.send(responseBody);
};

export default handler;
