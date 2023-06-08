import fastify from 'fastify';

import postStreamEvents from './postStreamEvents';

const server = fastify();

// Health check
server.get('/status', async () => {
  return 'OK';
});

server.post('/', postStreamEvents);

server.listen({ host: '0.0.0.0', port: 8080 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log(`Server listening at ${address}`);
});
