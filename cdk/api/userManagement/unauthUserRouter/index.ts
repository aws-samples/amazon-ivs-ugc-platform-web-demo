import { FastifyPluginAsync } from 'fastify';

import createChatToken from './createChatToken'
import forgotPassword from './forgotPassword';
import getChannelData from './getChannelData'
import signUp from './signUp';

const router: FastifyPluginAsync = async (resource) => {
  resource.get('/channel/:channelOwnerUsername', getChannelData);

  resource.post('/register', signUp);
  resource.post('/password/reset', forgotPassword);
  resource.post('/chatToken/create', createChatToken);
};

export default router;
