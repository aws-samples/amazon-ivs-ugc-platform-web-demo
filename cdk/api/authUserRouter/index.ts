import { FastifyPluginAsync } from 'fastify';
import { fastifyRequestContextPlugin } from 'fastify-request-context';

import createResources from './createResources';
import deleteUser from './deleteUser';
import getUser from './getUser';
import resetStreamKey from './resetStreamKey';

import authorizer, { UserContext } from './authorizer';

declare module 'fastify-request-context' {
  interface RequestContextData {
    user: UserContext;
  }
}

const router: FastifyPluginAsync = async (resource) => {
  resource.register(fastifyRequestContextPlugin, { hook: 'preHandler' });
  resource.addHook('preHandler', authorizer);

  resource.get('/', getUser);
  resource.post('/resources/create', createResources);
  resource.get('/streamKey/reset', resetStreamKey);
  resource.delete('/', deleteUser);
};

export default router;
