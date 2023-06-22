import fastify from 'fastify';

import postStreamEvents from './postStreamEvents';

const buildServer = () => {
  const _server = fastify();

  // Health check
  _server.get('/status', async () => {
    return 'OK';
  });

  _server.post('/', postStreamEvents);

  return _server;
};

export default buildServer;
