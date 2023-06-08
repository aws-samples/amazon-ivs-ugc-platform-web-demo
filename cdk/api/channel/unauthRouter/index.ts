import { FastifyPluginAsync } from 'fastify';

import createChatToken from './createChatToken';
import forgotPassword from './forgotPassword';
import signUp from './signUp';

const router: FastifyPluginAsync = async (resource) => {
  resource.post('/register', signUp);
  resource.post('/password/reset', forgotPassword);
  resource.post('/chatToken/create', createChatToken);
};

export default router;
