import fastify from 'fastify';
import fastifyCors from '@fastify/cors';

import userManagementRouters from './userManagement/';
import metricsRouter from './metrics/';

const buildServer = () => {
  const server = fastify();

  const origin = JSON.parse(process.env.ALLOWED_ORIGINS || 'false');

  // CORS
  server.register(fastifyCors, { origin });

  const { SERVICE_NAME: serviceName = '' } = process.env;

  if (['all', 'userManagement'].includes(serviceName)) {
    // Create /user authenticated and unauthenticated resources
    server.register(userManagementRouters, { prefix: 'user' });
  }

  if (['all', 'metrics'].includes(serviceName)) {
    // Create /metrics authenticated resource
    server.register(metricsRouter, { prefix: 'metrics' });
  }

  // Health check
  server.get('/status', async () => {
    return 'OK';
  });

  return server;
};

export default buildServer;
