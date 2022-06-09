import { FastifyInstance, HTTPMethods, InjectOptions } from 'fastify';

/**
 * This function will create and run two tests to ensure
 * that a given route isn't accessible when the provided OAuth token is missing or invalid
 */
export const createRouteAuthenticationTests = (
  server: FastifyInstance,
  route: string,
  method: HTTPMethods = 'GET'
) => {
  it('should return an unauthorized response when the auth token is missing', async () => {
    const response = await server.inject({
      method: method,
      url: route
    });
    const { message } = JSON.parse(response.payload);

    expect(response.statusCode).toBe(500);
    expect(message).toBe('Unauthorized');
  });

  it('should return an unauthorized response when the auth token is invalid', async () => {
    const response = await server.inject({
      method: method,
      url: route,
      headers: { authorization: 'invalidToken' }
    });
    const { message } = JSON.parse(response.payload);

    expect(response.statusCode).toBe(500);
    expect(message).toBe('Unauthorized');
  });
};

export const injectAuthorizedRequest = (
  server: FastifyInstance,
  opts: InjectOptions = { headers: {} }
) =>
  server.inject({
    ...opts,
    headers: { ...opts.headers, authorization: 'validToken' }
  });
