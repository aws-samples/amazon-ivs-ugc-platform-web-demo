import { FastifyPluginAsync } from 'fastify';
import createSpectatorToken from './createSpectatorToken';
import disconnectHost from './disconnectHost';

const router: FastifyPluginAsync = async (resource) => {
  resource.get('/createSpectatorToken/:stageId', createSpectatorToken);

  resource.post('/disconnect', disconnectHost);
};

export default router;
