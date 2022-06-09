import { ListStreamSessionsCommand } from '@aws-sdk/client-ivs';
import { mockClient } from 'aws-sdk-client-mock';

import {
  createRouteAuthenticationTests,
  injectAuthorizedRequest
} from '../../testUtils';
import { ivsClient } from '../getStreamSessions';
import { UNEXPECTED_EXCEPTION } from '../../utils/constants';
import buildServer from '../../buildServer';
import streamSessionsJsonMock from '../../__mocks__/streamSessions.json';

const streamSessionsMock = streamSessionsJsonMock.map((streamSession) => ({
  ...streamSession,
  startTime: new Date(streamSession.startTime),
  endTime: new Date(streamSession.endTime)
}));

const mockIvsClient = mockClient(ivsClient);
const route = '/metrics/channelResourceId/streamSessions';

describe('getStreamSessions controller', () => {
  const server = buildServer();
  const mockConsoleError = jest.fn();

  beforeAll(() => {
    console.error = mockConsoleError;
  });

  afterEach(() => {
    mockIvsClient.reset();
  });

  createRouteAuthenticationTests(server, route);

  it('should handle a request with an empty query string', async () => {
    mockIvsClient.on(ListStreamSessionsCommand).resolves({});

    const response = await injectAuthorizedRequest(server, { url: route });
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

  it('should return an unexpected exception when the IVS client fails', async () => {
    mockIvsClient.on(ListStreamSessionsCommand).rejects({});

    const response = await injectAuthorizedRequest(server, { url: route });
    const { __type } = JSON.parse(response.payload);

    expect(mockConsoleError).toHaveBeenCalledTimes(1);
    expect(response.statusCode).toBe(500);
    expect(__type).toBe(UNEXPECTED_EXCEPTION);
  });

  it('should build the channelArn correctly', async () => {
    const oldRegion = process.env.REGION;
    const oldAccountId = process.env.ACCOUNT_ID;
    process.env.REGION = 'region';
    process.env.ACCOUNT_ID = 'accountId';

    mockIvsClient
      .on(ListStreamSessionsCommand, {
        channelArn: 'arn:aws:ivs:region:accountId:channel/channelResourceId'
      })
      .resolves({ streamSessions: streamSessionsMock });

    const response = await injectAuthorizedRequest(server, { url: route });
    const { maxResults, streamSessions } = JSON.parse(response.payload);

    expect(response.statusCode).toBe(200);
    expect(maxResults).toBe(50);
    expect(streamSessions.length).toBe(1);

    process.env.REGION = oldRegion;
    process.env.ACCOUNT_ID = oldAccountId;
  });

  it('should return the encoded nextToken value', async () => {
    mockIvsClient
      .on(ListStreamSessionsCommand)
      .resolves({ nextToken: 'nextToken?' });

    const response = await injectAuthorizedRequest(server, { url: route });
    const { maxResults, nextToken, streamSessions } = JSON.parse(
      response.payload
    );

    expect(response.statusCode).toBe(200);
    expect(nextToken).toBe('nextToken%3F');
    expect(maxResults).toBe(50);
    expect(streamSessions.length).toBe(0);
  });
});
