import { FastifyPluginAsync } from 'fastify';
import { fastifyRequestContextPlugin } from '@fastify/request-context';
import authorizer from '../channel/authorizer';
import createStage from './createStage';
import leaveStage from './leaveStage';
import disconnectHost from './disconnectHost'
import createParticipantToken from './createParticipantToken';

const router: FastifyPluginAsync = async (resource) => {
  resource.register(fastifyRequestContextPlugin, { hook: 'preHandler' });
  resource.addHook('preHandler', authorizer);

  resource.post('/disconnect', disconnectHost)
  resource.get('/create', createStage);
  resource.get('/createParticipantToken/:stageId', createParticipantToken);
  resource.put('/leave', leaveStage);
};

export default router;
