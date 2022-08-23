import { FastifyReply, FastifyRequest } from 'fastify';
import { ChatTokenCapability } from '@aws-sdk/client-ivschat';

import {
  createChatRoomToken,
  getUser,
  ChatTokenCapabilityType
} from '../helpers';
import { ResponseBody } from '../../shared/helpers';
import { UNEXPECTED_EXCEPTION } from '../../shared/constants';
import { UserContext } from '../authorizer';

type CreatePrivateChatTokenRequestBody = { chatRoomOwnerUsername: string };

interface CreatePrivateChatTokenResponseBody extends ResponseBody {
  token?: string;
  sessionExpirationTime?: Date;
  tokenExpirationTime?: Date;
  capabilities: ChatTokenCapabilityType[];
}

const handler = async (
  request: FastifyRequest<{ Body: CreatePrivateChatTokenRequestBody }>,
  reply: FastifyReply
) => {
  const { chatRoomOwnerUsername } = request.body;
  const { username: viewerUsername, sub } = request.requestContext.get(
    'user'
  ) as UserContext;
  const capabilities = [ChatTokenCapability.SEND_MESSAGE];
  const responseBody: CreatePrivateChatTokenResponseBody = {
    capabilities: [...capabilities, 'VIEW_MESSAGE']
  };

  // Check input
  if (!chatRoomOwnerUsername) {
    reply.statusCode = 400;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  try {
    const { Item = {} } = await getUser(sub);
    const {
      avatar: { S: avatar },
      color: { S: color }
    } = Item;
    const viewerAttributes = { displayName: viewerUsername, avatar, color };

    const result = await createChatRoomToken(
      chatRoomOwnerUsername,
      viewerAttributes,
      capabilities
    );
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
