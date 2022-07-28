import { FastifyReply, FastifyRequest } from 'fastify';

import { UNEXPECTED_EXCEPTION } from '../../shared/constants';
import { createChatRoomToken } from '../helpers';

type CreateChatTokenRequestBody = { chatRoomOwnerUsername: string };

const handler = async (
  request: FastifyRequest<{ Body: CreateChatTokenRequestBody }>,
  reply: FastifyReply
) => {
  const { chatRoomOwnerUsername } = request.body;
  let token, sessionExpirationTime, tokenExpirationTime;

  // Check input
  if (!chatRoomOwnerUsername) {
    reply.statusCode = 400;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  try {
    ({ token, sessionExpirationTime, tokenExpirationTime } =
      await createChatRoomToken(chatRoomOwnerUsername));
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  reply.statusCode = 200;

  return reply.send({ token, sessionExpirationTime, tokenExpirationTime });
};

export default handler;
