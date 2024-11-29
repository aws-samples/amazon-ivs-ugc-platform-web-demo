import { FastifyReply, FastifyRequest } from 'fastify';

import {
  CHANNELS_TABLE_STAGE_FIELDS,
  STAGE_DELETION_EXCEPTION
} from '../../shared/constants';
import { handleDeleteStage, verifyUserIsStageHost } from '../helpers';
import { updateDynamoItemAttributes } from '../../shared/helpers';
import { UserContext } from '../../shared/authorizer';

const handler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { sub } = request.requestContext.get('user') as UserContext;
    const { stageId } = await verifyUserIsStageHost(sub);

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
