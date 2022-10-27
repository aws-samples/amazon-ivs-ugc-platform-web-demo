import { injectAuthorizedRequest } from '../testUtils';
import buildServer, { getOrigin } from '../buildServer';

const route = '/status';
const oldAllowedOrigins = process.env.ALLOWED_ORIGINS;

describe('buildServer', () => {
  afterEach(() => {
    process.env.ALLOWED_ORIGINS = oldAllowedOrigins;
  });

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
      delete process.env.ALLOWED_ORIGINS;

      const server = buildServer();
      const response = await server.inject({ url: route });

      expect(response.statusCode).toBe(200);
      expect(response.payload).toBe('OK');
    });

    it('should return OK when calling the health check route', async () => {
      const server = buildServer();
      const response = await server.inject({ url: route });

      expect(response.statusCode).toBe(200);
      expect(response.payload).toBe('OK');
    });
  });

  describe('getOrigin function', () => {
    it('should disable CORS by default', () => {
      delete process.env.ALLOWED_ORIGINS;

      const origin = getOrigin();

      expect(origin).toBe(false);
    });

    it('should set origin to the provided list of domains', () => {
      const allowedOrigins = ['example.com', 'awesomedomain.com'];
      process.env.ALLOWED_ORIGINS = JSON.stringify(allowedOrigins);

      const origin = getOrigin() as string[];

      expect(origin.length).toBe(2);
      expect(origin[0]).toBe(allowedOrigins[0]);
      expect(origin[1]).toBe(allowedOrigins[1]);
    });

    it('should set origin to "*"', () => {
      const allowedOrigins = ['*', 'example.com'];
      process.env.ALLOWED_ORIGINS = JSON.stringify(allowedOrigins);

      const origin = getOrigin() as string;

      expect(origin).toBe('*');
    });

    it('should disable CORS', () => {
      const allowedOrigins: string[] = [];
      process.env.ALLOWED_ORIGINS = JSON.stringify(allowedOrigins);

      const origin = getOrigin();

      expect(origin).toBe(false);
    });
  });
});
