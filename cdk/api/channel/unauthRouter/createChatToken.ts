import { FastifyReply, FastifyRequest } from 'fastify';
import { ChatTokenCapability } from '@aws-sdk/client-ivschat';

import {
  ChatTokenCapabilityType,
  ChatTokenError,
  createChatRoomToken,
  getUser
} from '../helpers';
import { getChannelAssetUrls, ResponseBody } from '../../shared/helpers';
import {
  UNAUTHORIZED_EXCEPTION,
  UNEXPECTED_EXCEPTION
} from '../../shared/constants';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import authorizer from '../authorizer';

type CreateChatTokenRequestBody = { chatRoomOwnerUsername: string };

interface CreateChatTokenResponseBody extends ResponseBody {
  token?: string;
  sessionExpirationTime?: Date;
  tokenExpirationTime?: Date;
  capabilities?: ChatTokenCapabilityType[];
}

const handler = async (
  request: FastifyRequest<{ Body: CreateChatTokenRequestBody }>,
  reply: FastifyReply
) => {
  const { chatRoomOwnerUsername } = request.body; // chatRoomOwnerUsername is case sensitive
  const responseBody: CreateChatTokenResponseBody = {};
  let viewerSub;

  try {
    const { authorization: authorizationToken } = request.headers;
    const isAuthRequest = !!authorizationToken;

    if (isAuthRequest) {
      ({ sub: viewerSub } = await authorizer(request));
    }
  } catch (error) {
    console.error(error);

    reply.statusCode = 401;

    return reply.send({ __type: UNAUTHORIZED_EXCEPTION });
  }

  // Check input
  if (!chatRoomOwnerUsername) {
    reply.statusCode = 400;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  try {
    let token, sessionExpirationTime, tokenExpirationTime;
    const capabilities: ChatTokenCapabilityType[] = [];

    if (!viewerSub) {
      ({ token, sessionExpirationTime, tokenExpirationTime } =
        await createChatRoomToken(chatRoomOwnerUsername));
    } else {
      const { Item = {} } = await getUser(viewerSub);
      const {
        avatar,
        channelAssets,
        color,
        username: viewerUsername,
        channelArn: viewerChannelArn
      } = unmarshall(Item);
      const { avatar: avatarUrl } = getChannelAssetUrls(channelAssets);
      const channelAssetUrls = { ...(avatarUrl ? { avatar: avatarUrl } : {}) };
      const viewerAttributes = {
        avatar,
        channelAssetUrls: JSON.stringify(channelAssetUrls),
        color,
        displayName: viewerUsername,
        channelArn: viewerChannelArn
      };
      const isModerator = viewerUsername === chatRoomOwnerUsername;
      capabilities.push(ChatTokenCapability.SEND_MESSAGE);

      if (isModerator) {
        capabilities.push(
          ChatTokenCapability.DELETE_MESSAGE,
          ChatTokenCapability.DISCONNECT_USER
        );
      }

      ({ token, sessionExpirationTime, tokenExpirationTime } =
        await createChatRoomToken(
          chatRoomOwnerUsername,
          viewerAttributes,
          capabilities
        ));
    }

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
