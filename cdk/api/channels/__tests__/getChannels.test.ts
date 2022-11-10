import { marshall } from '@aws-sdk/util-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { ScanCommand } from '@aws-sdk/client-dynamodb';

import {
  BAD_REQUEST_EXCEPTION,
  UNEXPECTED_EXCEPTION
} from '../../shared/constants';
import { dynamoDbClient } from '../../shared/helpers';
import buildServer from '../../buildServer';
import offlineStreamSession from '../__mocks__/offlineStreamSession.json';
import onlineStreamSessions from '../__mocks__/onlineStreamSessions.json';

const mockDynamoDbClient = mockClient(dynamoDbClient);
const url = '/channels';
const channelObject = {
  avatar: 'avatar',
  color: 'color',
  username: 'username'
};

describe('getChannels controller', () => {
  const server = buildServer();
  const mockConsoleError = jest.fn();
  const realConsoleError = console.error;

  beforeAll(() => {
    process.env.STREAM_TABLE_NAME = 'streamTableName';
    process.env.CHANNELS_TABLE_NAME = 'channelsTableName';

    console.error = mockConsoleError;
  });

  afterAll(() => {
    delete process.env.STREAM_TABLE_NAME;
    delete process.env.CHANNELS_TABLE_NAME;

    console.error = realConsoleError;
  });

  beforeEach(() => {
    mockDynamoDbClient.reset();
    mockDynamoDbClient
      .on(ScanCommand, { TableName: 'streamTableName' })
      .resolves({ Items: [] });
    mockDynamoDbClient
      .on(ScanCommand, { TableName: 'channelsTableName' })
      .resolves({ Items: [] });
  });

  describe('error handling', () => {
    it('should return a bad request exception when no filter is provided', async () => {
      const response = await server.inject({ url });
      const { __type, message } = JSON.parse(response.payload);

      expect(response.statusCode).toBe(400);
      expect(__type).toBe(BAD_REQUEST_EXCEPTION);
      expect(message).toBe('Missing required filter, one of: isLive');
    });

    it('should return a bad request exception when an invalid filter is provided', async () => {
      const response = await server.inject({
        url,
        query: { invalidFilter: 'true' }
      });
      const { __type, message } = JSON.parse(response.payload);

      expect(response.statusCode).toBe(400);
      expect(__type).toBe(BAD_REQUEST_EXCEPTION);
      expect(message).toBe('Missing required filter, one of: isLive');
    });

    it('should return an unexpected exception when the DynamoDB client fails', async () => {
      mockDynamoDbClient
        .on(ScanCommand, { TableName: 'streamTableName' })
        .rejects({});

      const response = await server.inject({ url, query: { isLive: 'true' } });
      const { __type } = JSON.parse(response.payload);

      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(500);
      expect(__type).toBe(UNEXPECTED_EXCEPTION);
    });

    it('should return an empty list of channels when the stream table returns undefined Items', async () => {
      mockDynamoDbClient
        .on(ScanCommand, { TableName: 'streamTableName' })
        .resolves({});

      const response = await server.inject({ url, query: { isLive: 'true' } });
      const { channels, maxResults } = JSON.parse(response.payload);

      expect(maxResults).toBe(50);
      expect(channels.length).toBe(0);
    });

    it('should return an empty list of channels when the channels table returns undefined Items', async () => {
      mockDynamoDbClient
        .callsFakeOnce(({ TableName }) => {
          if (TableName === 'streamTableName')
            return { Items: [marshall(onlineStreamSessions[0])] };

          throw new Error();
        })
        .callsFakeOnce(({ TableName }) => {
          if (TableName === 'channelsTableName') return {};

          throw new Error();
        });

      const response = await server.inject({ url, query: { isLive: 'true' } });
      const { channels, maxResults } = JSON.parse(response.payload);

      expect(maxResults).toBe(50);
      expect(channels.length).toBe(0);
    });
  });

  describe('general cases', () => {
    it('should return an empty list of channels when isLive is set to false', async () => {
      const response = await server.inject({ url, query: { isLive: 'false' } });
      const { channels, maxResults } = JSON.parse(response.payload);

      expect(maxResults).toBe(50);
      expect(channels.length).toBe(0);
    });

    it('should return an empty list of channels when the list of live sessions is empty', async () => {
      const response = await server.inject({ url, query: { isLive: 'true' } });
      const { channels, maxResults } = JSON.parse(response.payload);

      expect(maxResults).toBe(50);
      expect(channels.length).toBe(0);
    });

    it('should return an empty list of channels when no session is live', async () => {
      mockDynamoDbClient
        .on(ScanCommand, { TableName: 'streamTableName' })
        .resolves({ Items: [marshall(offlineStreamSession)] });

      const response = await server.inject({ url, query: { isLive: 'true' } });
      const { channels, maxResults } = JSON.parse(response.payload);

      expect(maxResults).toBe(50);
      expect(channels.length).toBe(0);
    });

    it('should return a list with one live channel', async () => {
      mockDynamoDbClient
        .callsFakeOnce(({ TableName }) => {
          if (TableName === 'streamTableName')
            return { Items: [marshall(onlineStreamSessions[0])] };

          throw new Error();
        })
        .callsFakeOnce(({ TableName, ExpressionAttributeValues }) => {
          if (
            TableName === 'channelsTableName' &&
            ExpressionAttributeValues[':channelArn0'].S ===
              onlineStreamSessions[0].channelArn
          )
            return {
              Items: [marshall({ ...channelObject, streamKey: 'streamKey' })] // Check that the endpoint strips out private data
            };

          throw new Error();
        });

      const response = await server.inject({ url, query: { isLive: 'true' } });
      const { channels, maxResults } = JSON.parse(response.payload);

      expect(maxResults).toBe(50);
      expect(channels.length).toBe(1);
      expect(channels[0]).toEqual(channelObject);
    });

    it('should return a list with channels sorted by stream start time', async () => {
      mockDynamoDbClient
        .callsFakeOnce(({ TableName }) => {
          if (TableName === 'streamTableName')
            return {
              Items: onlineStreamSessions.map((onlineStreamSession) =>
                marshall(onlineStreamSession)
              )
            };

          throw new Error();
        })
        .callsFakeOnce(({ TableName }) => {
          if (TableName === 'channelsTableName')
            return {
              Items: onlineStreamSessions.map(({ channelArn }) =>
                marshall({
                  ...channelObject,
                  channelArn,
                  username: channelArn.split('channelArn-')[1],
                  streamKey: 'streamKey'
                })
              )
            };

          throw new Error();
        });

      const response = await server.inject({ url, query: { isLive: 'true' } });
      const { channels, maxResults } = JSON.parse(response.payload);

      expect(maxResults).toBe(50);
      expect(channels.length).toBe(3);
      expect(channels[0]).toEqual({ ...channelObject, username: 'user2' });
      expect(channels[1]).toEqual({ ...channelObject, username: 'user1' });
      expect(channels[2]).toEqual({ ...channelObject, username: 'user3' });
    });
  });
});
