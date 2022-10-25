import { injectAuthorizedRequest } from '../testUtils';
import buildServer from '../buildServer';

const route = '/status';

describe('buildServer function', () => {
  it('should not register any router if SERVICE_NAME is missing', async () => {
    const oldServiceName = process.env.SERVICE_NAME;
    delete process.env.SERVICE_NAME;
    const server = buildServer();

    let response = await injectAuthorizedRequest(server, {
      url: '/metrics/channelResourceId/streamSessions'
    });

    expect(response.statusCode).toBe(404);

    response = await injectAuthorizedRequest(server, {
      url: '/user'
    });

    expect(response.statusCode).toBe(404);

    process.env.SERVICE_NAME = oldServiceName;
  });

  it('should return OK when calling the health check route when ALLOWED_ORIGINS is missing', async () => {
    const oldAllowedOrigins = process.env.ALLOWED_ORIGINS;
    delete process.env.ALLOWED_ORIGINS;

    const server = buildServer();
    const response = await server.inject({ url: route });

    expect(response.statusCode).toBe(200);
    expect(response.payload).toBe('OK');

    process.env.ALLOWED_ORIGINS = oldAllowedOrigins;
  });

  it('should return OK when calling the health check route', async () => {
    const server = buildServer();
    const response = await server.inject({ url: route });

    expect(response.statusCode).toBe(200);
    expect(response.payload).toBe('OK');
  });
});
