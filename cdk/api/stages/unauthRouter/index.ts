import { FastifyPluginAsync } from 'fastify';
import createSpectatorToken from './createSpectatorToken';
import sendHostDisconnectMessage from './sendHostDisconnectMessage';

const router: FastifyPluginAsync = async (resource) => {
  resource.get('/createSpectatorToken/:stageId', createSpectatorToken);

  resource.post('/sendHostDisconnectMessage', sendHostDisconnectMessage);
};

export default router;
