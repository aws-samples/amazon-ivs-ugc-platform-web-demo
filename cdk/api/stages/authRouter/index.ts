import { FastifyPluginAsync } from 'fastify';
import { fastifyRequestContextPlugin } from '@fastify/request-context';
import authorizer from '../../shared/authorizer';
import createStage from './createStage';
import deleteStage from './deleteStage';
import getStage from './getStage';
import createParticipantToken from './createParticipantToken';
import disconnectParticipant from './disconnectParticipant';

const router: FastifyPluginAsync = async (resource) => {
  resource.register(fastifyRequestContextPlugin, { hook: 'preHandler' });
  resource.addHook('preHandler', authorizer);

  resource.get('/:stageId', getStage);
  resource.get('/create', createStage);
  resource.get(
    '/createParticipantToken/:stageId/:participantType',
    createParticipantToken
  );
  resource.put('/delete', deleteStage);
  resource.put('/disconnectParticipant', disconnectParticipant);
};

export default router;
