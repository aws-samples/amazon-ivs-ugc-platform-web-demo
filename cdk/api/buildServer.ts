import fastify from 'fastify';
import fastifyCors from '@fastify/cors';

import channelRouters from './channel';
import channelsRouters from './channels';
import metricsRouter from './metrics/';
import productsRouters from './product';

import configureRoute from './shared/hooks/configureRoute';
import { MAX_SERVER_PARAM_LENGTH } from './shared/constants';

export const getOrigin = () => {
  // By default, disable CORS
  let origin: string[] | string | boolean = false;
  const parsedOrigins: string[] = JSON.parse(
    process.env.ALLOWED_ORIGINS || '[]'
  );

  if (parsedOrigins.length) origin = parsedOrigins;
  if (parsedOrigins.find((parsedOrigin) => parsedOrigin === '*')) origin = '*';

  return origin;
};

const buildServer = () => {
  const server = fastify({
    maxParamLength: MAX_SERVER_PARAM_LENGTH
  });

  // Register CORS
  server.register(fastifyCors, { origin: getOrigin() });

  // Hooks
  server.addHook('onRoute', configureRoute);

  const {
    ENABLE_AMAZON_PRODUCT_STREAM_ACTION: enableAmazonProductRoute,
    SERVICE_NAME: serviceName = ''
  } = process.env;

  if (['all', 'channels'].includes(serviceName)) {
    // Create /channel authenticated and unauthenticated resources
    server.register(channelRouters, { prefix: 'channel' });

    // Create /channels authenticated and unauthenticated resources
    server.register(channelsRouters, { prefix: 'channels' });

    if (enableAmazonProductRoute === 'true') {
      // Create /products authenticated resources
      server.register(productsRouters, { prefix: 'products' });
    }
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
