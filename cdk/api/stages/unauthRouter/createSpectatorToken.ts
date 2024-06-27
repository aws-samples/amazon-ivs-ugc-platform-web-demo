import { FastifyReply, FastifyRequest } from 'fastify';

import { UNEXPECTED_EXCEPTION } from '../../shared/constants';
import {
  buildStageArn,
  handleCreateStageParams,
  handleCreateParticipantToken,
  PARTICIPANT_USER_TYPES,
  isStageActive,
  PARTICIPANT_GROUP
} from '../helpers';

interface GetParticipantTokenParams {
  userStageId: string;
  displayStageId: string;
}

const handler = async (
  request: FastifyRequest<{
    Params: GetParticipantTokenParams;
  }>,
  reply: FastifyReply
) => {
  const participantType = PARTICIPANT_USER_TYPES.SPECTATOR;

  try {
    const { userStageId, displayStageId } = request.params;
    const shouldJoinStage = await isStageActive(userStageId);

    if (!shouldJoinStage) {
      throw new Error('Stage is empty');
    }

    const { duration, userId, capabilities, userType } =
      await handleCreateStageParams({
        participantType
      });

    const userStageArn = buildStageArn(userStageId);
    const displayStageArn = buildStageArn(displayStageId);

    const { token: userToken, participantId: userParticipantId } =
      await handleCreateParticipantToken({
        stageArn: userStageArn,
        duration,
        userId,
        capabilities,
        attributes: {
          type: PARTICIPANT_USER_TYPES.SPECTATOR,
          participantGroup: PARTICIPANT_GROUP.USER
        }
      });
    const { token: displayToken, participantId: displayParticipantId } =
      await handleCreateParticipantToken({
        stageArn: displayStageArn,
        duration,
        userId,
        capabilities,
        attributes: {
          type: PARTICIPANT_USER_TYPES.SPECTATOR,
          participantGroup: PARTICIPANT_GROUP.DISPLAY
        }
      });

    reply.statusCode = 200;
    return reply.send({
      [PARTICIPANT_GROUP.USER]: {
        token: userToken,
        stageId: userStageId,
        participantId: userParticipantId,
        participantGroup: PARTICIPANT_GROUP.USER
      },
      [PARTICIPANT_GROUP.DISPLAY]: {
        token: displayToken,
        stageId: displayStageId,
        participantId: displayParticipantId,
        participantGroup: PARTICIPANT_GROUP.DISPLAY
      },
      participantRole: userType
    });
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;
    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }
};

export default handler;
