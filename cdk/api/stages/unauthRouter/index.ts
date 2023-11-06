import { FastifyPluginAsync } from 'fastify';
import createSpectatorToken from './createSpectatorToken';
import sendHostDisconnectedMessage from './sendHostDisconnectedMessage';
import revokeStageRequest from './revokeStageRequest'

const router: FastifyPluginAsync = async (resource) => {
  resource.get('/createSpectatorToken/:stageId', createSpectatorToken);

  resource.post('/sendHostDisconnectedMessage', sendHostDisconnectedMessage);
  resource.post('/revokeStageRequest', revokeStageRequest)
};

export default router;
