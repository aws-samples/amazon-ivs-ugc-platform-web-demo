import { FastifyReply, FastifyRequest } from 'fastify';
import { v4 as uuidv4 } from 'uuid';

import {
  CHANNELS_TABLE_STAGE_FIELDS,
  STAGE_PARTICIPANT_TYPES,
  UNEXPECTED_EXCEPTION
} from '../shared/constants';
import { UserContext } from '../channel/authorizer';
import { handleCreateStageParams, handleCreateStage } from './helpers';
import { updateDynamoItemAttributes } from '../shared/helpers';

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
            type: STAGE_PARTICIPANT_TYPES.HOST
          },
          capabilities,
          duration,
          userId
        }
      ],
      tags: {
        creationDate: stageCreationDate
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
