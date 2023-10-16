import { FastifyPluginAsync } from 'fastify';
import { fastifyRequestContextPlugin } from '@fastify/request-context';
import authorizer from '../channel/authorizer';
import createStage from './createStage';
import deleteStage from './deleteStage';
import createParticipantToken from './createParticipantToken';

const router: FastifyPluginAsync = async (resource) => {
  resource.register(fastifyRequestContextPlugin, { hook: 'preHandler' });
  resource.addHook('preHandler', authorizer);

  resource.get('/create', createStage);
  resource.get('/createParticipantToken/:stageId', createParticipantToken);
  resource.put('/delete', deleteStage);
};

export default router;
