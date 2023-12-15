import { FastifyReply, FastifyRequest } from 'fastify';

import { UNEXPECTED_EXCEPTION } from '../../shared/constants';
import { UserContext } from '../../shared/authorizer';
import {
  buildStageArn,
  handleCreateStageParams,
  handleCreateParticipantToken,
  ParticipantType,
  isUserInStage,
  shouldAllowParticipantToJoin,
  PARTICIPANT_USER_TYPES,
  validateRequestParams,
  participantTypesArray
} from '../helpers';

interface GetParticipantTokenParams {
  stageId: string;
  participantType: ParticipantType;
}

const handler = async (
  request: FastifyRequest<{
    Params: GetParticipantTokenParams;
  }>,
  reply: FastifyReply
) => {
  try {
    const { stageId, participantType } = request.params;
    const missingParams = validateRequestParams(stageId, participantType);
    if (missingParams) {
      throw new Error(`Missing ${missingParams}`);
    }

    const { sub, username } = request.requestContext.get('user') as UserContext;

    let isHostInStage = false;
    if (participantType === PARTICIPANT_USER_TYPES.HOST) {
      // Check for host presence
      isHostInStage = await isUserInStage(stageId, sub);
    } else if (participantType === PARTICIPANT_USER_TYPES.INVITED) {
      const isParticipantAllowedToJoin = await shouldAllowParticipantToJoin(
        stageId
      );
      if (!isParticipantAllowedToJoin) {
        throw new Error('Stage is at capacity');
      }
    }

    const {
      username: preferredUsername,
      profileColor,
      avatar,
      channelAssetsAvatarUrl,
      duration,
      userId,
      capabilities,
      userType: type,
      channelId
    } = await handleCreateStageParams({
      userSub: sub,
      participantType,
      isHostInStage
    });

    const stageArn = buildStageArn(stageId);

    const params = {
      stageArn,
      duration,
      userId,
      attributes: {
        username: preferredUsername || username,
        type,
        profileColor,
        avatar,
        channelId,
        channelAssetsAvatarUrl,
        ...(participantTypesArray.includes(participantType) && {
          participantTokenCreationDate: Date.now().toString()
        })
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
