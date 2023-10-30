import { FastifyReply, FastifyRequest } from 'fastify';

import {
  UNEXPECTED_EXCEPTION
} from '../../shared/constants';
import {
  verifyUserIsStageHost,
  handleDisconnectParticipant
} from '../helpers';
import { UserContext } from '../../shared/authorizer';

export type DisconnectParticipantRequestBody = {
  participantId: string;
};

const handler = async (
  request: FastifyRequest<{ Body: DisconnectParticipantRequestBody }>,
  reply: FastifyReply
) => {
  try {
    const { participantId } = request.body;
    if (!participantId) throw new Error('Participant id is required');

    const { sub } = request.requestContext.get('user') as UserContext;

    const { stageId } = await verifyUserIsStageHost(sub);

    await handleDisconnectParticipant(participantId, stageId);

    reply.statusCode = 200;
    return reply.send({
      message: `Participant, with participantId: ${participantId}, has been kicked out of the session.`
    });
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;
    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }
};

export default handler;
