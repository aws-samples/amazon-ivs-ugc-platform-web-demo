import { FastifyPluginAsync } from 'fastify';

import forgotPassword from './forgotPassword';
import signUp from './signUp';
import createPublicChatToken from './createPublicChatToken';
import getChannelData from './getChannelData'

const router: FastifyPluginAsync = async (resource) => {
  resource.get('/channel/:channelOwnerUsername', getChannelData);

  resource.post('/register', signUp);
  resource.post('/password/reset', forgotPassword);
  resource.post('/chatroom/token/public/create', createPublicChatToken);
};

export default router;
