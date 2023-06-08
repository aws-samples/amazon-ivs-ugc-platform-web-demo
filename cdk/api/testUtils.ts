import { FastifyInstance, InjectOptions } from 'fastify';

type HTTPMethods = 'DELETE' | 'GET' | 'POST' | 'PUT';

/**
 * This function will create and run two tests to ensure
 * that a given route isn't accessible when the provided OAuth token is missing or invalid
 */
export const createRouteAuthenticationTests = ({
  server,
  url,
  method = 'GET'
}: {
  server: FastifyInstance;
  url: string;
  method?: HTTPMethods;
}) => {
  it('should return an unauthorized response when the auth token is missing', async () => {
    const response = await server.inject({ method, url });
    const { message } = JSON.parse(response.payload);

    expect(response.statusCode).toBe(500);
    expect(message).toBe('UnauthorizedException');
  });

  it('should return an unauthorized response when the auth token is invalid', async () => {
    const response = await server.inject({
      method,
      url,
      headers: { authorization: 'invalidToken' }
    });
    const { message } = JSON.parse(response.payload);

    expect(response.statusCode).toBe(500);
    expect(message).toBe('UnauthorizedException');
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
