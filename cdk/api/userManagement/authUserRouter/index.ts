import { FastifyPluginAsync } from 'fastify';
import { fastifyRequestContextPlugin } from '@fastify/request-context';

import authorizer, { UserContext } from '../authorizer';
import banUser from './banUser';
import changeUsername from './changeUsername';
import changeUserPreferences from './changeUserPreferences';
import createResources from './createResources';
import deleteUser from './deleteUser';
import getUser from './getUser';
import resetStreamKey from './resetStreamKey';
import sendStreamAction from './sendStreamAction';
import unbanUser from './unbanUser';

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

  resource.post('/channel/actions/send', sendStreamAction);
  resource.post('/channel/ban', banUser);
  resource.post('/channel/unban', unbanUser);
  resource.post('/resources/create', createResources);

  resource.put('/username/update', changeUsername);
  resource.put('/preferences/update', changeUserPreferences);

  resource.delete('/', deleteUser);
};

export default router;
