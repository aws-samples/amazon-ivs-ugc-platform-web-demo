import fastify from 'fastify';
import fastifyCors from 'fastify-cors';

import userManagementRouters from './userManagement/';
import metricsRouter from './metrics/';

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

server.listen(8080, '0.0.0.0', (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log(`Server listening at ${address}`);
});
