import { FastifyReply, FastifyRequest } from 'fastify';
import { v4 as uuidv4 } from 'uuid';

import {
  STAGE_PARTICIPANT_TYPES,
  UNEXPECTED_EXCEPTION
} from '../shared/constants';
import { UserContext } from '../channel/authorizer';
import { handleCreateStageParams, handleCreateStage } from './helpers';

const handler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { sub, username } = request.requestContext.get('user') as UserContext;
    const {
      username: preferredUsername,
      profileColor,
      avatar,
      channelAssetsAvatarUrlPath,
      duration,
      userId,
      capabilities
    } = await handleCreateStageParams(sub);

    const params = {
      name: `${username}-${uuidv4()}`,
      participantTokenConfigurations: [
        {
          attributes: {
            username: preferredUsername || username,
            profileColor,
            avatar,
            channelAssetsAvatarUrlPath,
            type: STAGE_PARTICIPANT_TYPES.HOST
          },
          capabilities,
          duration,
          userId
        }
      ],
      tags: {
        creationDate: Date.now().toString()
      }
    };

    const { token, stageId } = await handleCreateStage(params);

    reply.statusCode = 200;
    return reply.send({
      token,
      stageId
    });
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;
    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }
};

export default handler;
