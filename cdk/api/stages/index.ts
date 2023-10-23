import { FastifyPluginAsync } from 'fastify';
import { fastifyRequestContextPlugin } from '@fastify/request-context';
import authorizer from '../channel/authorizer';
import createStage from './createStage';
import disconnectHost from './disconnectHost';
import deleteStage from './deleteStage';
import createParticipantToken from './createParticipantToken';

const router: FastifyPluginAsync = async (resource) => {
  resource.register(fastifyRequestContextPlugin, { hook: 'preHandler' });
  resource.addHook('preHandler', authorizer);

  resource.get('/create', createStage);
  resource.get(
    '/createParticipantToken/:stageId/:participantType',
    createParticipantToken
  );
  resource.put('/delete', deleteStage);
  resource.post('/disconnect', disconnectHost);
};

export default router;
