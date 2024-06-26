import { FastifyReply, FastifyRequest } from 'fastify';

import { UNEXPECTED_EXCEPTION } from '../../shared/constants';
import {
  buildStageArn,
  handleCreateStageParams,
  handleCreateParticipantToken,
  PARTICIPANT_USER_TYPES,
  isStageActive
} from '../helpers';

interface GetParticipantTokenParams {
  stageId: string;
}

const handler = async (
  request: FastifyRequest<{
    Params: GetParticipantTokenParams;
  }>,
  reply: FastifyReply
) => {
  const participantType = PARTICIPANT_USER_TYPES.SPECTATOR;

  try {
    const { stageId } = request.params;
    const shouldJoinStage = await isStageActive(stageId);
    if (!shouldJoinStage) {
      throw new Error('Stage is empty');
    }

    const { duration, userId, capabilities } = await handleCreateStageParams({
      participantType
    });

    const stageArn = buildStageArn(stageId);

    const params = {
      stageArn,
      duration,
      userId,
      capabilities,
      attributes: {
        type: PARTICIPANT_USER_TYPES.SPECTATOR
      }
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
