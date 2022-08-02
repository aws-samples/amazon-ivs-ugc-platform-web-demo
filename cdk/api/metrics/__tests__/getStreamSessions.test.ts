import { marshall } from '@aws-sdk/util-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { QueryCommand } from '@aws-sdk/client-dynamodb';

import {
  createRouteAuthenticationTests,
  injectAuthorizedRequest
} from '../../testUtils';
import { dynamoDbClient } from '../../shared/helpers';
import { encryptNextToken } from '../helpers';
import { UNEXPECTED_EXCEPTION } from '../../shared/constants';
import buildServer from '../../buildServer';
import streamSessionJsonMock from '../../__mocks__/streamSessions.json';

const defaultExpectedSessions = [
  {
    startTime: streamSessionJsonMock[0].startTime,
    endTime: streamSessionJsonMock[0].endTime,
    hasErrorEvent: false,
    streamId: 'streamId'
  }
];

const mockDynamoDbClient = mockClient(dynamoDbClient);
const route = '/metrics/channelResourceId/streamSessions';

describe('getStreamSessions controller', () => {
  const server = buildServer();
  const mockConsoleError = jest.fn();

  beforeAll(() => {
    console.error = mockConsoleError;
  });

  beforeEach(() => {
    mockDynamoDbClient.reset();
    mockDynamoDbClient.on(QueryCommand).resolves({
      Items: [marshall({ ...streamSessionJsonMock[0], userSub: 'sub' })]
    });
  });

  createRouteAuthenticationTests(server, route);

  it('should handle a request with an empty query string', async () => {
    mockDynamoDbClient.on(QueryCommand).resolves({});

    const response = await injectAuthorizedRequest(server, { url: route });
    const { maxResults, streamSessions } = JSON.parse(response.payload);

    expect(response.statusCode).toBe(200);
    expect(maxResults).toBe(50);
    expect(streamSessions.length).toBe(0);
  });

  it('should handle a request with an empty nextToken query parameter', async () => {
    mockDynamoDbClient.on(QueryCommand).resolves({});

    const response = await injectAuthorizedRequest(server, {
      url: route,
      query: { nextToken: '' }
    });
    const { maxResults, streamSessions } = JSON.parse(response.payload);

    expect(response.statusCode).toBe(200);
    expect(maxResults).toBe(50);
    expect(streamSessions.length).toBe(0);
  });

  it('should return an unexpected exception when the DynamoDB client fails', async () => {
    mockDynamoDbClient.on(QueryCommand).rejects({});

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

    const response = await injectAuthorizedRequest(server, { url: route });
    const { maxResults, streamSessions } = JSON.parse(response.payload);

    expect(
      mockDynamoDbClient.commandCalls(QueryCommand)[0].args[0].input
        .ExpressionAttributeValues?.[':userChannelArn'].S
    ).toBe('arn:aws:ivs:region:accountId:channel/channelResourceId');
    expect(response.statusCode).toBe(200);
    expect(maxResults).toBe(50);
    expect(streamSessions).toMatchObject(defaultExpectedSessions);

    process.env.REGION = oldRegion;
    process.env.ACCOUNT_ID = oldAccountId;
  });

  it('should not include sessions where the sub does not match', async () => {
    mockDynamoDbClient.on(QueryCommand).resolves({
      Items: [
        marshall({ ...streamSessionJsonMock[0], userSub: 'differentSub' })
      ]
    });

    const response = await injectAuthorizedRequest(server, { url: route });
    const { maxResults, streamSessions } = JSON.parse(response.payload);

    expect(response.statusCode).toBe(200);
    expect(maxResults).toBe(50);
    expect(streamSessions.length).toBe(0);
  });

  it('should handle missing startTime and endTime', async () => {
    mockDynamoDbClient.on(QueryCommand).resolves({
      Items: [
        marshall({ id: 'streamId', hasErrorEvent: false, userSub: 'sub' })
      ]
    });

    const response = await injectAuthorizedRequest(server, { url: route });
    const { maxResults, streamSessions } = JSON.parse(response.payload);

    expect(response.statusCode).toBe(200);
    expect(maxResults).toBe(50);
    expect(streamSessions).toMatchObject([
      { hasErrorEvent: false, streamId: 'streamId' }
    ]);
  });

  it('should return the nextToken value', async () => {
    mockDynamoDbClient
      .on(QueryCommand)
      .resolves({ LastEvaluatedKey: { id: { S: 'streamId' } } });

    const response = await injectAuthorizedRequest(server, { url: route });
    const { maxResults, nextToken, streamSessions } = JSON.parse(
      response.payload
    );

    expect(response.statusCode).toBe(200);
    expect(typeof nextToken).toBe('string');
    expect(maxResults).toBe(50);
    expect(streamSessions.length).toBe(0);
  });

  it('should decrypt the token value', async () => {
    const response = await injectAuthorizedRequest(server, {
      url: route,
      query: { nextToken: encryptNextToken('{"id":"123"}') }
    });
    const { maxResults, streamSessions } = JSON.parse(response.payload);

    expect(
      mockDynamoDbClient.commandCalls(QueryCommand)[0].args[0].input
        .ExclusiveStartKey?.id
    ).toBe('123');
    expect(response.statusCode).toBe(200);
    expect(maxResults).toBe(50);
    expect(streamSessions).toMatchObject(defaultExpectedSessions);
  });
});
