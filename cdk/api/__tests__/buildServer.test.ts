import buildServer from '../buildServer';

const route = '/status';

describe('buildServer function', () => {
  const server = buildServer();

  it('should return OK when calling the health check route', async () => {
    const response = await server.inject({ url: route });

    expect(response.statusCode).toBe(200);
    expect(response.payload).toBe('OK');
  });
});
