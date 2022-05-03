import { FastifyPluginAsync } from 'fastify';
import { fastifyRequestContextPlugin } from 'fastify-request-context';

import authorizer from '../userManagement/authUserRouter/authorizer';
import getStreamSession from './getStreamSession';
import getStreamSessionMetricsData from './getStreamSessionMetricsData';
import getStreamSessions from './getStreamSessions';

const router: FastifyPluginAsync = async (resource) => {
  resource.register(fastifyRequestContextPlugin, { hook: 'preHandler' });
  resource.addHook('preHandler', authorizer);

  resource.get('/:channelResourceId/streamSessions', getStreamSessions);
  resource.get(
    '/:channelResourceId/streamSessions/:streamSessionId',
    getStreamSession
  );
  resource.get(
    '/:channelResourceId/streamSessions/:streamSessionId/metricsData',
    getStreamSessionMetricsData
  );
};

export default router;
