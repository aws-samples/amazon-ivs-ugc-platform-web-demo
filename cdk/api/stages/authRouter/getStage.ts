import { FastifyReply, FastifyRequest } from 'fastify';

import {
  RESOURCE_NOT_FOUND_EXCEPTION,
  UNEXPECTED_EXCEPTION
} from '../../shared/constants';
import { getStage } from '../helpers';

export type GetStageParams = {
  stageId: string;
};

const handler = async (
  request: FastifyRequest<{ Params: GetStageParams }>,
  reply: FastifyReply
) => {
  try {
    const { stageId } = request.params;

    const { stage } = await getStage(stageId);

    reply.statusCode = 200;
    return reply.send(stage);
  } catch (error: unknown) {
    const { name } = error as Error;

    reply.statusCode = name === RESOURCE_NOT_FOUND_EXCEPTION ? 404 : 500;

    const errorType =
      name === RESOURCE_NOT_FOUND_EXCEPTION
        ? RESOURCE_NOT_FOUND_EXCEPTION
        : UNEXPECTED_EXCEPTION;

    return reply.send({ __type: errorType });
  }
};

export default handler;
