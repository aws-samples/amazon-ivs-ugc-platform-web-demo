import { FastifyPluginAsync } from 'fastify';

import userManagementAuthUserRouter from './authUserRouter';
import userManagementUnauthUserRouter from './unauthUserRouter';

const router: FastifyPluginAsync = async (userResource) => {
  // Create /user authenticated resource
  userResource.register(userManagementAuthUserRouter);

  // Create /user unauthenticated resource
  userResource.register(userManagementUnauthUserRouter);
};

export default router;
