import { FastifyPluginAsync } from 'fastify';
import { fastifyRequestContextPlugin } from '@fastify/request-context';

import authorizer, { UserContext } from '../authorizer';
import banUser from './banUser';
import changeUsername from './changeUsername';
import changeUserPreferences from './changeUserPreferences';
import createResources from './createResources';
import deleteChannelAsset from './deleteChannelAsset';
import deleteUser from './deleteUser';
import generateImagePresignedPost from './generateImagePresignedPost';
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

  resource.post('/actions/send', sendStreamAction);
  resource.post('/ban', banUser);
  resource.post('/unban', unbanUser);
  resource.post('/resources/create', createResources);
  resource.post(
    '/assets/imagePresignedPost/create',
    generateImagePresignedPost
  );

  resource.put('/username/update', changeUsername);
  resource.put('/preferences/update', changeUserPreferences);

  resource.delete('/', deleteUser);
  resource.delete('/asset', deleteChannelAsset);
};

export default router;
