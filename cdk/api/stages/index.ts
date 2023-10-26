import { FastifyPluginAsync } from 'fastify';

import stageAuthRouter from './authRouter';
import stageUnauthRouter from './unauthRouter';

const router: FastifyPluginAsync = async (resource) => {
  // Create /stage authenticated resource
  resource.register(stageAuthRouter);

  // Create /stage unauthenticated resource
  resource.register(stageUnauthRouter);
};

export default router;
