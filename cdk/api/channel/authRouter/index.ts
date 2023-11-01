import { FastifyPluginAsync } from 'fastify';
import { fastifyRequestContextPlugin } from '@fastify/request-context';

import authorizer, { UserContext } from '../../shared/authorizer';
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
import addToFollowingList from './addToFollowingList';
import removeFromFollowingList from './removeFromFollowingList';
import getFollowingChannels from './getFollowingChannels';
import getStreamLiveStatus from './getStreamLiveStatus'

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
  resource.get('/followingList', getFollowingChannels);
  resource.get('/stream/liveStatus', getStreamLiveStatus);

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
  resource.put('/followingList/add', addToFollowingList);
  resource.put('/followingList/remove', removeFromFollowingList);

  resource.delete('/', deleteUser);
  resource.delete('/asset', deleteChannelAsset);
};

export default router;
