import { FastifyReply, FastifyRequest } from 'fastify';
import { v4 as uuidv4 } from 'uuid';

import {
  CHANNELS_TABLE_STAGE_FIELDS,
  UNEXPECTED_EXCEPTION
} from '../shared/constants';
import { getUser } from '../channel/helpers';
import {
  handleCreateStageParams,
  handleCreateStage,
  PARTICIPANT_USER_TYPES
} from './helpers';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { getChannelId, updateDynamoItemAttributes } from '../shared/helpers';
import { UserContext } from '../channel/authorizer';

const handler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { sub, username } = request.requestContext.get('user') as UserContext;
    const { Item: UserItem = {} } = await getUser(sub);
    const { channelArn, stageId: channelTableStageId = null } =
      unmarshall(UserItem);

    if (channelTableStageId) {
      throw new Error('Operation cannot be completed. active stage found.');
    }

    if (!channelArn) {
      throw new Error('No IVS resources have been created for this user.');
    }

    const channelId = getChannelId(channelArn);
    const {
      username: preferredUsername,
      profileColor,
      avatar,
      channelAssetsAvatarUrlPath,
      duration,
      userId,
      capabilities,
      userType: type
    } = await handleCreateStageParams({
      userSub: sub,
      participantType: PARTICIPANT_USER_TYPES.HOST
    });
    const stageCreationDate = Date.now().toString();

    const params = {
      name: `${username}-${uuidv4()}`,
      participantTokenConfigurations: [
        {
          attributes: {
            username: preferredUsername || username,
            profileColor,
            avatar,
            channelAssetsAvatarUrlPath,
            type
          },
          capabilities,
          duration,
          userId
        }
      ],
      tags: {
        creationDate: stageCreationDate,
        stageOwnerChannelId: channelId
      }
    };

    const { token, stageId } = await handleCreateStage(params);

    await updateDynamoItemAttributes({
      attributes: [
        { key: CHANNELS_TABLE_STAGE_FIELDS.STAGE_ID, value: stageId },
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
