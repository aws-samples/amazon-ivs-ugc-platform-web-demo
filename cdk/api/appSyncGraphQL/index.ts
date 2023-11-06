import { FastifyPluginAsync } from 'fastify';

import appSyncGraphQLUnauthRouter from './unauthRouter';

const router: FastifyPluginAsync = async (resource) => {
  // Create /graphql unauthenticated resource
  resource.register(appSyncGraphQLUnauthRouter);
};

export default router;
