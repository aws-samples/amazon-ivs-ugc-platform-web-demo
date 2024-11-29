import { FastifyReply, FastifyRequest } from 'fastify';

import { UNEXPECTED_EXCEPTION } from '../../shared/constants';
import { getUser } from '../../channel/helpers';
import {
  handleCreateStageParams,
  handleCreateStage,
  PARTICIPANT_USER_TYPES,
  handleCreateParticipantToken,
  participantTypesArray,
  PARTICIPANT_GROUP,
  isUserInStage,
  PARTICIPANT_TYPES,
  generateHostUserId
} from '../helpers';
import { UserContext } from '../../shared/authorizer';

const handler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { sub, username } = request.requestContext.get('user') as UserContext;
    const { Item: channelData = undefined } = await getUser(sub);

    const {
      channelArn,
      username: preferredUsername,
      profileColor,
      avatar,
      channelAssetsAvatarUrl,
      duration: userTokenDuration,
      userId,
      capabilities: userCapabilities,
      userType: hostType,
      stageId,
      channelId
    } = await handleCreateStageParams({
      userSub: sub,
      participantType: PARTICIPANT_USER_TYPES.HOST,
      channelData
    });

    const {
      duration: displayTokenDuration,
      userId: displayUserId,
      capabilities: displayCapabilities,
      userType: screenshareType
    } = await handleCreateStageParams({
      participantType: PARTICIPANT_USER_TYPES.SCREENSHARE,
      channelData
    });

    if (!channelArn) {
      throw new Error('No IVS resources have been created for this user.');
    }

    if (stageId) {
      const stageArn = `arn:aws:ivs:${process.env.REGION}:${process.env.ACCOUNT_ID}:stage/${stageId}`;

      const sharedAttrParams = {
        username: preferredUsername || username,
        profileColor,
        avatar,
        channelAssetsAvatarUrl,
        ...(participantTypesArray.includes(PARTICIPANT_USER_TYPES.HOST) && {
          participantTokenCreationDate: Date.now().toString()
        }),
        channelId
      };

      // Check if user, the host, is in the stage. If so, then the participantRole should be set to INVITE instead of HOST.
      const isInStage = await isUserInStage(stageId, sub);
      const participantRole = isInStage ? PARTICIPANT_TYPES.INVITED : hostType;
      const userStageUserId = isInStage
        ? userId
        : generateHostUserId(channelArn);

      console.log('User stage participantRole: ', participantRole);

      const { token: userToken, participantId: userParticipantId } =
        await handleCreateParticipantToken(
          {
            stageArn,
            duration: userTokenDuration,
            userId: userStageUserId,
            attributes: {
              ...sharedAttrParams,
              type: participantRole,
              participantGroup: PARTICIPANT_GROUP.USER
            },
            capabilities: userCapabilities
          },
          false
        );
      const { token: displayToken, participantId: displayParticipantId } =
        await handleCreateParticipantToken(
          {
            stageArn,
            duration: displayTokenDuration,
            userId: displayUserId,
            attributes: {
              ...sharedAttrParams,
              type: screenshareType,
              participantGroup: PARTICIPANT_GROUP.DISPLAY
            },
            capabilities: displayCapabilities
          },
          false
        );

      if (
        userToken &&
        userParticipantId &&
        displayToken &&
        displayParticipantId
      ) {
        reply.statusCode = 200;
        return reply.send({
          [PARTICIPANT_GROUP.USER]: {
            token: userToken,
            participantId: userParticipantId,
            participantGroup: PARTICIPANT_GROUP.USER
          },
          [PARTICIPANT_GROUP.DISPLAY]: {
            token: displayToken,
            participantId: displayParticipantId,
            participantGroup: PARTICIPANT_GROUP.DISPLAY
          },
          stageId,
          participantRole
        });
      }
    }

    const newStageConfig = await handleCreateStage({
      username: preferredUsername || username,
      profileColor,
      avatar,
      channelAssetsAvatarUrl,
      channelArn,
      sub
    });

    reply.statusCode = 200;
    return reply.send({
      ...newStageConfig,
      participantRole: hostType
    });
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;
    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }
};

export default handler;
