import fastify from 'fastify';
import fastifyCors from 'fastify-cors';

import authUserRouter from './authUserRouter';
import unauthUserRouter from './unauthUserRouter';

const server = fastify();

// CORS
server.register(fastifyCors, { origin: process.env.ALLOWED_ORIGIN });

// Create /user authenticated resource
server.register(authUserRouter, { prefix: 'user' });

// Create /user unauthenticated resource
server.register(unauthUserRouter, { prefix: 'user' });

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
