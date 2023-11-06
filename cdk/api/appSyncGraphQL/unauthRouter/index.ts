import { FastifyPluginAsync } from 'fastify';

import revokeStageRequest from './revokeStageRequest';

const router: FastifyPluginAsync = async (resource) => {
  resource.post('/revokeStageRequest', revokeStageRequest);
};

export default router;
