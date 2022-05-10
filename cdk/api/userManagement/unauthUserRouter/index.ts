import { FastifyPluginAsync } from 'fastify';

import forgotPassword from './forgotPassword';
import signUp from './signUp';

const router: FastifyPluginAsync = async (resource) => {
  resource.post('/register', signUp);
  resource.post('/password/reset', forgotPassword);
};

export default router;