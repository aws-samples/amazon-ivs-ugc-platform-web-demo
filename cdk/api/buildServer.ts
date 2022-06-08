import fastify from 'fastify';
import fastifyCors from 'fastify-cors';

import userManagementRouters from './userManagement/';
import metricsRouter from './metrics/';

const buildServer = () => {
  const server = fastify();

  // CORS
  server.register(fastifyCors, { origin: process.env.ALLOWED_ORIGIN });

  // Create /user authenticated and unauthenticated resources
  server.register(userManagementRouters, { prefix: 'user' });

  // Create /metrics authenticated resource
  server.register(metricsRouter, { prefix: 'metrics' });

  // Health check
  server.get('/status', async () => {
    return 'OK';
  });

  return server;
};

export default buildServer;
