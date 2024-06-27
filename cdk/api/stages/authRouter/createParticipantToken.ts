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
  participantTypesArray,
  PARTICIPANT_GROUP
} from '../helpers';
import { getUser } from '../../channel/helpers';

interface GetParticipantTokenParams {
  userStageId: string;
  displayStageId: string;
  participantType: ParticipantType;
}

const handler = async (
  request: FastifyRequest<{
    Params: GetParticipantTokenParams;
  }>,
  reply: FastifyReply
) => {
  try {
    const { userStageId, displayStageId, participantType } = request.params;
    const missingParams = validateRequestParams(
      userStageId,
      displayStageId,
      participantType
    );
    if (missingParams) {
      throw new Error(`Missing ${missingParams}`);
    }

    const { sub, username } = request.requestContext.get('user') as UserContext;

    let isHostInStage = false;
    if (participantType === PARTICIPANT_USER_TYPES.HOST) {
      // Check for host presence
      isHostInStage = await isUserInStage(userStageId, sub);
    } else if (participantType === PARTICIPANT_USER_TYPES.INVITED) {
      const isParticipantAllowedToJoin = await shouldAllowParticipantToJoin(
        userStageId
      );
      if (!isParticipantAllowedToJoin) {
        throw new Error('Stage is at capacity');
      }
    }

    const { Item: channelData = {} } = await getUser(sub);

    const {
      username: preferredUsername,
      profileColor,
      avatar,
      channelAssetsAvatarUrl,
      duration: userTokenDuration,
      userId,
      capabilities: userCapabilities,
      userType,
      channelId
    } = await handleCreateStageParams({
      userSub: sub,
      participantType,
      channelData
    });
    const {
      duration: displayTokenDuration,
      userId: displayId,
      capabilities: displayCapabilities,
      userType: screenshareType
    } = await handleCreateStageParams({
      userSub: sub,
      participantType: PARTICIPANT_USER_TYPES.SCREENSHARE,
      channelData
    });
    const sharedAttrParams = {
      username: preferredUsername || username,
      profileColor,
      avatar,
      channelAssetsAvatarUrl,
      ...(participantTypesArray.includes(participantType) && {
        participantTokenCreationDate: Date.now().toString()
      }),
      channelId
    };

    const userStageArn = buildStageArn(userStageId);
    const displayStageArn = buildStageArn(displayStageId);

    const userStageConfig = await handleCreateParticipantToken({
      stageArn: userStageArn,
      duration: userTokenDuration,
      userId,
      attributes: {
        ...sharedAttrParams,
        type: userType,
        participantGroup: PARTICIPANT_GROUP.USER
      },
      capabilities: userCapabilities
    });
    const displayStageConfig = await handleCreateParticipantToken({
      stageArn: displayStageArn,
      duration: displayTokenDuration,
      userId: displayId,
      attributes: {
        ...sharedAttrParams,
        type: screenshareType,
        participantGroup: PARTICIPANT_GROUP.DISPLAY
      },
      capabilities: displayCapabilities
    });

    reply.statusCode = 200;
    return reply.send({
      [PARTICIPANT_GROUP.USER]: {
        ...userStageConfig,
        participantGroup: PARTICIPANT_GROUP.USER
      },
      [PARTICIPANT_GROUP.DISPLAY]: {
        ...displayStageConfig,
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
