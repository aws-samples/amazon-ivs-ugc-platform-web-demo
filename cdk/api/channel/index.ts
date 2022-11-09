import { FastifyPluginAsync } from 'fastify';

import channelAuthRouter from './authRouter';
import channelUnauthRouter from './unauthRouter';

const router: FastifyPluginAsync = async (channelResource) => {
  // Create /channel authenticated resource
  channelResource.register(channelAuthRouter);

  // Create /channel unauthenticated resource
  channelResource.register(channelUnauthRouter);
};

export default router;
