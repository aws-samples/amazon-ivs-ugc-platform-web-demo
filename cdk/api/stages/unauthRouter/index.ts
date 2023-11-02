import { FastifyPluginAsync } from 'fastify';
import createSpectatorToken from './createSpectatorToken';
import sendHostDisconnectedMessage from './sendHostDisconnectedMessage';

const router: FastifyPluginAsync = async (resource) => {
  resource.get('/createSpectatorToken/:stageId', createSpectatorToken);

  resource.post('/sendHostDisconnectedMessage', sendHostDisconnectedMessage);
};

export default router;
