import { FastifyPluginAsync } from 'fastify';
import { fastifyRequestContextPlugin } from 'fastify-request-context';

import authorizer from '../userManagement/authUserRouter/authorizer';
import getStreamSession from './getStreamSession';
import getStreamSessions from './getStreamSessions';

const router: FastifyPluginAsync = async (resource) => {
  resource.register(fastifyRequestContextPlugin, { hook: 'preHandler' });
  resource.addHook('preHandler', authorizer);

  resource.get('/:channelArnSuffix/streamSessions', getStreamSessions);
  resource.get(
    '/:channelArnSuffix/streamSessions/:streamSessionId',
    getStreamSession
  );
};

export default router;
