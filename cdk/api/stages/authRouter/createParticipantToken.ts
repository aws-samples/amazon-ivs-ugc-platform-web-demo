import { FastifyReply, FastifyRequest } from 'fastify';

import { UNEXPECTED_EXCEPTION } from '../../shared/constants';
import { UserContext } from '../../shared/authorizer';
import {
  buildStageArn,
  handleCreateStageParams,
  handleCreateParticipantToken,
  ParticipantType,
  shouldAllowParticipantToJoin,
  PARTICIPANT_USER_TYPES,
  validateRequestParams,
  participantTypesArray,
  PARTICIPANT_GROUP,
  getStageHostDataAndSize,
  HostData
} from '../helpers';
import { getUser } from '../../channel/helpers';

interface GetParticipantTokenParams {
  stageId: string;
  participantType: ParticipantType;
  hostData: HostData;
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
    if (participantType === PARTICIPANT_USER_TYPES.HOST)
      throw new Error('Host participant type is not permitted');

    const { sub, username } = request.requestContext.get('user') as UserContext;

    let hostData = null;
    if (
      participantType === PARTICIPANT_USER_TYPES.INVITED ||
      participantType === PARTICIPANT_USER_TYPES.REQUESTED
    ) {
      const stageHostDataAndSize = await getStageHostDataAndSize(stageId);
      hostData = stageHostDataAndSize.hostData;

      const isParticipantAllowedToJoin = await shouldAllowParticipantToJoin({
        hostStatus: hostData.status,
        numberOfParticipantInStage: stageHostDataAndSize.size
      });

      if (!isParticipantAllowedToJoin) {
        throw new Error('Stage is at capacity');
      }
    }

    // Get create participant token parameters
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

    const stageArn = buildStageArn(stageId);

    // Create the user and display participant tokens
    const displayStageConfig = await handleCreateParticipantToken({
      stageArn,
      duration: displayTokenDuration,
      userId: displayId,
      attributes: {
        ...sharedAttrParams,
        type: screenshareType,
        participantGroup: PARTICIPANT_GROUP.DISPLAY
      },
      capabilities: displayCapabilities
    });
    const userStageConfig = await handleCreateParticipantToken({
      stageArn,
      duration: userTokenDuration,
      userId,
      attributes: {
        ...sharedAttrParams,
        type: userType,
        participantGroup: PARTICIPANT_GROUP.USER,
        displayParticipantId: displayStageConfig.participantId || ''
      },
      capabilities: userCapabilities
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
      participantRole: userType,
      hostData
    });
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;
    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }
};

export default handler;
