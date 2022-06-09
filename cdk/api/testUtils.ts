import { FastifyInstance, HTTPMethods, InjectOptions } from 'fastify';

export const createRouteAuthenticationTest = (
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
