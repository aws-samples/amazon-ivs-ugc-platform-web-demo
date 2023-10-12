import { FastifyReply, FastifyRequest } from 'fastify';
import { v4 as uuidv4 } from 'uuid';

import {
  CHANNELS_TABLE_STAGE_FIELDS,
  UNEXPECTED_EXCEPTION
} from '../shared/constants';
import { UserContext } from '../channel/authorizer';
import { updateDynamoItemAttributes } from '../shared/helpers';

const handler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { sub } = request.requestContext.get('user') as UserContext;

    await updateDynamoItemAttributes({
      attributes: [
        { key: CHANNELS_TABLE_STAGE_FIELDS.STAGE_ID, value: null },
        { key: CHANNELS_TABLE_STAGE_FIELDS.STAGE_CREATION_DATE, value: null }
      ],
      primaryKey: { key: 'id', value: sub },
      tableName: process.env.CHANNELS_TABLE_NAME as string
    });

    reply.statusCode = 200;
    return reply.send({ message: 'You have left the stage.' });
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;
    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }
};

export default handler;
