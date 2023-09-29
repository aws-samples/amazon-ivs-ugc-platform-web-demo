import { FastifyReply, FastifyRequest } from 'fastify';

import { UNEXPECTED_EXCEPTION } from '../shared/constants';
import { UserContext } from '../channel/authorizer';
import {
  buildStageArn,
  handleCreateStageParams,
  handleCreateParticipantToken
} from './helpers';

interface GetParticipantTokenParams {
  stageId: string;
}

const handler = async (
  request: FastifyRequest<{
    Params: GetParticipantTokenParams;
  }>,
  reply: FastifyReply
) => {
  try {
    const { stageId } = request.params;
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

    const stageArn = buildStageArn(stageId);

    const params = {
      stageArn,
      duration,
      userId,
      attributes: {
        username: preferredUsername || username,
        profileColor,
        avatar,
        channelAssetsAvatarUrlPath,
        participantTokenCreationDate: Date.now().toString()
      },
      capabilities
    };

    const token = await handleCreateParticipantToken(params);

    reply.statusCode = 200;
    return reply.send({ token });
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;
    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }
};

export default handler;
