import { FastifyReply, FastifyRequest } from 'fastify';

import {
  CHANNELS_TABLE_STAGE_FIELDS,
  STAGE_DELETION_EXCEPTION
} from '../shared/constants';
import { handleDeleteStage, getStage } from './helpers';
import { getUser } from '../channel/helpers';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { getChannelId, updateDynamoItemAttributes } from '../shared/helpers';
import { UserContext } from '../channel/authorizer';

const handler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { sub } = request.requestContext.get('user') as UserContext;
    const { Item: UserItem = {} } = await getUser(sub);
    const { stageId = null, channelArn } = unmarshall(UserItem);
    if (!stageId) {
      throw new Error('No active stage found.');
    }

    const { stage } = await getStage(stageId);
    const channelId = getChannelId(channelArn);
    const stageOwnerChannelId = stage?.tags?.stageOwnerChannelId;
    const isStageHost = stageOwnerChannelId === channelId;

    if (!isStageHost) {
      throw new Error('Channel ownership verification failed.');
    }

    await handleDeleteStage(stageId);

    await updateDynamoItemAttributes({
      attributes: [
        { key: CHANNELS_TABLE_STAGE_FIELDS.STAGE_ID, value: null },
        { key: CHANNELS_TABLE_STAGE_FIELDS.STAGE_CREATION_DATE, value: null }
      ],
      primaryKey: { key: 'id', value: sub },
      tableName: process.env.CHANNELS_TABLE_NAME as string
    });

    reply.statusCode = 200;
    return reply.send({
      message: `Stage, with stageId: ${stageId}, has been deleted.`
    });
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;
    return reply.send({ __type: STAGE_DELETION_EXCEPTION });
  }
};

export default handler;
