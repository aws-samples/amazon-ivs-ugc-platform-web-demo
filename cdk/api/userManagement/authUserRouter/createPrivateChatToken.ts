import { FastifyReply, FastifyRequest } from 'fastify';
import { ChatTokenCapability } from '@aws-sdk/client-ivschat';

import {
  ChatTokenCapabilityType,
  ChatTokenError,
  createChatRoomToken,
  getUser
} from '../helpers';
import { ResponseBody } from '../../shared/helpers';
import { UNEXPECTED_EXCEPTION } from '../../shared/constants';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { UserContext } from '../authorizer';

type CreatePrivateChatTokenRequestBody = { chatRoomOwnerUsername: string };

interface CreatePrivateChatTokenResponseBody extends ResponseBody {
  token?: string;
  sessionExpirationTime?: Date;
  tokenExpirationTime?: Date;
  capabilities?: ChatTokenCapabilityType[];
}

const handler = async (
  request: FastifyRequest<{ Body: CreatePrivateChatTokenRequestBody }>,
  reply: FastifyReply
) => {
  const { chatRoomOwnerUsername } = request.body; // chatRoomOwnerUsername is case sensitive
  const { sub } = request.requestContext.get('user') as UserContext;
  let responseBody: CreatePrivateChatTokenResponseBody = {};

  // Check input
  if (!chatRoomOwnerUsername) {
    reply.statusCode = 400;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  try {
    const { Item = {} } = await getUser(sub);
    const { avatar, color, username: viewerUsername } = unmarshall(Item);
    const viewerAttributes = { displayName: viewerUsername, avatar, color };
    const isModerator = viewerUsername === chatRoomOwnerUsername;
    let capabilities = [ChatTokenCapability.SEND_MESSAGE];

    if (isModerator) {
      capabilities.push(
        ChatTokenCapability.DELETE_MESSAGE,
        ChatTokenCapability.DISCONNECT_USER
      );
    }

    const result = await createChatRoomToken(
      chatRoomOwnerUsername,
      viewerAttributes,
      capabilities
    );
    const { token, sessionExpirationTime, tokenExpirationTime } = result;
    responseBody.capabilities = [...capabilities, 'VIEW_MESSAGE'];
    responseBody.token = token;
    responseBody.sessionExpirationTime = sessionExpirationTime;
    responseBody.tokenExpirationTime = tokenExpirationTime;
  } catch (error) {
    console.error(error);

    if (error instanceof ChatTokenError) {
      reply.statusCode = error.code;

      return reply.send({ __type: error.name });
    }

    reply.statusCode = 500;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  reply.statusCode = 200;

  return reply.send(responseBody);
};

export default handler;
