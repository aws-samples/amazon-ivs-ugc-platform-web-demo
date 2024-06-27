import { FastifyReply, FastifyRequest } from 'fastify';
import { v4 as uuidv4 } from 'uuid';

import {
  CHANNELS_TABLE_STAGE_FIELDS,
  UNEXPECTED_EXCEPTION
} from '../../shared/constants';
import { getUser } from '../../channel/helpers';
import {
  handleCreateStageParams,
  handleCreateStage,
  PARTICIPANT_USER_TYPES,
  handleCreateParticipantToken,
  participantTypesArray,
  PARTICIPANT_GROUP
} from '../helpers';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { getChannelId, updateDynamoItemAttributes } from '../../shared/helpers';
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
      userId: hostUserId,
      capabilities: userCapabilities,
      userType: hostType,
      userStageId,
      displayStageId
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
      userSub: sub,
      participantType: PARTICIPANT_USER_TYPES.SCREENSHARE,
      channelData
    });

    if (!channelArn) {
      throw new Error('No IVS resources have been created for this user.');
    }

    if (userStageId && displayStageId) {
      // throw new Error('Operation cannot be completed. active stage found.');
      const userStageArn = `arn:aws:ivs:${process.env.REGION}:${process.env.ACCOUNT_ID}:stage/${userStageId}`;
      const displayStageArn = `arn:aws:ivs:${process.env.REGION}:${process.env.ACCOUNT_ID}:stage/${displayStageId}`;

      const sharedAttrParams = {
        username: preferredUsername || username,
        profileColor,
        avatar,
        channelAssetsAvatarUrl,
        ...(participantTypesArray.includes(PARTICIPANT_USER_TYPES.HOST) && {
          participantTokenCreationDate: Date.now().toString()
        })
      };

      const { token: userToken, participantId: userParticipantId } =
        await handleCreateParticipantToken(
          {
            stageArn: userStageArn,
            duration: userTokenDuration,
            userId: hostUserId,
            attributes: {
              ...sharedAttrParams,
              type: hostType,
              participantGroup: PARTICIPANT_GROUP.USER
            },
            capabilities: userCapabilities
          },
          false
        );
      const { token: displayToken, participantId: displayParticipantId } =
        await handleCreateParticipantToken(
          {
            stageArn: displayStageArn,
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
          user: {
            token: userToken,
            stageId: userStageId,
            participantId: userParticipantId,
            participantGroup: PARTICIPANT_GROUP.USER
          },
          display: {
            token: displayToken,
            stageId: displayStageId,
            participantId: displayParticipantId,
            participantGroup: PARTICIPANT_GROUP.DISPLAY
          },
          participantRole: 'host'
        });
      }
    }

    const channelId = getChannelId(channelArn);
    const stageCreationDate = Date.now().toString();
    const sharedAttrParams = {
      username: preferredUsername || username,
      profileColor,
      avatar,
      channelAssetsAvatarUrl
    };

    const {
      token: userToken,
      stageId: newUserStageId,
      participantId: userParticipantId
    } = await handleCreateStage({
      name: `${username}-${uuidv4()}`,
      participantTokenConfigurations: [
        {
          attributes: {
            ...sharedAttrParams,
            type: hostType,
            participantGroup: PARTICIPANT_GROUP.USER
          },
          capabilities: userCapabilities,
          duration: userTokenDuration,
          userId: hostUserId
        }
      ],
      tags: {
        creationDate: stageCreationDate,
        stageOwnerChannelId: channelId
      }
    });
    const {
      token: displayToken,
      stageId: newDisplayStageId,
      participantId: displayParticipantId
    } = await handleCreateStage({
      name: `${username}-${uuidv4()}`,
      participantTokenConfigurations: [
        {
          attributes: {
            ...sharedAttrParams,
            type: screenshareType,
            participantGroup: PARTICIPANT_GROUP.DISPLAY
          },
          capabilities: displayCapabilities,
          duration: displayTokenDuration,
          userId: displayUserId
        }
      ],
      tags: {
        creationDate: stageCreationDate,
        stageOwnerChannelId: channelId
      }
    });

    console.log('CREATE STAGE - WRITING TO DYNAMO');

    await updateDynamoItemAttributes({
      attributes: [
        {
          key: CHANNELS_TABLE_STAGE_FIELDS.USER_STAGE_ID,
          value: newUserStageId
        },
        {
          key: CHANNELS_TABLE_STAGE_FIELDS.DISPLAY_STAGE_ID,
          value: newDisplayStageId
        },
        {
          key: CHANNELS_TABLE_STAGE_FIELDS.STAGE_CREATION_DATE,
          value: stageCreationDate
        },
        {
          key: CHANNELS_TABLE_STAGE_FIELDS.STAGE_CREATION_DATE,
          value: stageCreationDate
        }
      ],
      primaryKey: { key: 'id', value: sub },
      tableName: process.env.CHANNELS_TABLE_NAME as string
    });

    reply.statusCode = 200;
    return reply.send({
      [PARTICIPANT_GROUP.USER]: {
        token: userToken,
        stageId: newUserStageId,
        participantId: userParticipantId,
        participantGroup: PARTICIPANT_GROUP.USER
      },
      [PARTICIPANT_GROUP.DISPLAY]: {
        token: displayToken,
        stageId: newDisplayStageId,
        participantId: displayParticipantId,
        participantGroup: PARTICIPANT_GROUP.DISPLAY
      },
      participantRole: hostType
    });
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;
    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }
};

export default handler;
