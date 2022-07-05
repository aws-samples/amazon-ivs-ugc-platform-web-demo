import { FastifyPluginAsync } from 'fastify';
import { fastifyRequestContextPlugin } from '@fastify/request-context';

import authorizer, { UserContext } from '../authorizer';
import changeUsername from './changeUsername';
import createResources from './createResources';
import deleteUser from './deleteUser';
import getUser from './getUser';
import resetStreamKey from './resetStreamKey';

declare module '@fastify/request-context' {
  interface RequestContextData {
    user: UserContext;
  }
}

const router: FastifyPluginAsync = async (resource) => {
  resource.register(fastifyRequestContextPlugin, { hook: 'preHandler' });
  resource.addHook('preHandler', authorizer);

  resource.get('/', getUser);
  resource.get('/streamKey/reset', resetStreamKey);

  resource.post('/resources/create', createResources);

  resource.put('/username/update', changeUsername);

  resource.delete('/', deleteUser);
};

export default router;
