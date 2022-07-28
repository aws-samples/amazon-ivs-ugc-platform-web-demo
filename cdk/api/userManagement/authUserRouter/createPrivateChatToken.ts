import { FastifyReply, FastifyRequest } from 'fastify';

import { createChatRoomToken } from '../helpers';
import { UNEXPECTED_EXCEPTION } from '../../shared/constants';
import { UserContext } from '../authorizer';

type CreateChatTokenRequestBody = { chatRoomOwnerUsername: string };

const handler = async (
  request: FastifyRequest<{ Body: CreateChatTokenRequestBody }>,
  reply: FastifyReply
) => {
  const { chatRoomOwnerUsername } = request.body;
  const { username: viewerUsername } = request.requestContext.get(
    'user'
  ) as UserContext;
  let token, sessionExpirationTime, tokenExpirationTime;

  // Check input
  if (!chatRoomOwnerUsername) {
    reply.statusCode = 400;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  try {
    const capabilities = ['SEND_MESSAGE'];
    ({ token, sessionExpirationTime, tokenExpirationTime } =
      await createChatRoomToken(
        chatRoomOwnerUsername,
        viewerUsername,
        capabilities
      ));
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  reply.statusCode = 200;

  return reply.send({ token, sessionExpirationTime, tokenExpirationTime });
};

export default handler;
