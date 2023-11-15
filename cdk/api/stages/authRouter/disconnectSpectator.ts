import { FastifyReply, FastifyRequest } from 'fastify';

import { UNEXPECTED_EXCEPTION } from '../../shared/constants';
import { handleDisconnectParticipant, validateRequestParams } from '../helpers';
import { UserContext } from '../../shared/authorizer';
import { getUser } from '../../channel/helpers';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { getChannelId } from '../../shared/helpers';

export type DisconnectParticipantRequestBody = {
  participantId: string;
  participantChannelId: string;
  stageId: string;
};

const handler = async (
  request: FastifyRequest<{ Body: DisconnectParticipantRequestBody }>,
  reply: FastifyReply
) => {
  try {
    const { participantId, participantChannelId, stageId } = request.body;

    const missingParams = validateRequestParams(
      participantId,
      participantChannelId,
      stageId
    );
    if (missingParams) {
      throw new Error(`Missing ${missingParams}`);
    }

    const { sub } = request.requestContext.get('user') as UserContext;

    const { Item: UserItem = {} } = await getUser(sub);
    const { channelArn } = unmarshall(UserItem);
    const channelId = getChannelId(channelArn);

    if (channelId !== participantChannelId)
      throw new Error('Verification failed');

    await handleDisconnectParticipant(participantId, stageId);

    reply.statusCode = 200;
    return reply.send({
      message: `Spectator, with participantId: ${participantId}, has been removed from the session.`
    });
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;
    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }
};

export default handler;
