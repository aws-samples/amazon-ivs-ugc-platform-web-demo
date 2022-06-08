import { ListStreamSessionsCommand } from '@aws-sdk/client-ivs';
import { mockClient } from 'aws-sdk-client-mock';

import {
  createRouteAuthenticationTest,
  injectAuthorizedRequest
} from '../../testUtils';
import { ivsClient } from '../getStreamSessions';
import buildServer from '../../buildServer';

const mockIvsClient = mockClient(ivsClient);
const route = '/metrics/channelResourceId/streamSessions';

describe('getStreamSessions controller', () => {
  const server = buildServer();

  createRouteAuthenticationTest(
    server,
    '/metrics/channelResourceId/streamSessions'
  );

  it('should handle a request with an empty query string', async () => {
    mockIvsClient.on(ListStreamSessionsCommand).resolves({});

    const response = await injectAuthorizedRequest(server, {
      url: route
    });
    const { maxResults, streamSessions } = JSON.parse(response.payload);

    expect(response.statusCode).toBe(200);
    expect(maxResults).toBe(50);
    expect(streamSessions.length).toBe(0);
  });

  it('should handle a request with an empty nextToken query parameter', async () => {
    mockIvsClient.on(ListStreamSessionsCommand).resolves({});

    const response = await injectAuthorizedRequest(server, {
      url: route,
      query: { nextToken: '' }
    });
    const { maxResults, streamSessions } = JSON.parse(response.payload);

    expect(response.statusCode).toBe(200);
    expect(maxResults).toBe(50);
    expect(streamSessions.length).toBe(0);
  });
});
