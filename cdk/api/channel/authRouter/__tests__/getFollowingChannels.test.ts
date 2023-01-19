import {
  GetItemCommand,
  QueryCommand,
  ScanCommand
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';

import { UNEXPECTED_EXCEPTION } from '../../../shared/constants';
import {
  dynamoDbClient,
  ExtendedChannelDbRecord
} from '../../../shared/helpers';
import {
  createRouteAuthenticationTests,
  injectAuthorizedRequest
} from '../../../testUtils';
import { buildChannelArn } from '../../../metrics/helpers';
import buildServer from '../../../buildServer';
import onlineStreamSessions from '../../../channels/__mocks__/onlineStreamSessions.json';
import offlineStreamSessions from '../__mocks__/offlineStreamSessions.json';

const url = '/channel/followingList';
const mockDynamoDbClient = mockClient(dynamoDbClient);
const defaultRequestParams = { method: 'GET' as const, url };
const channelObject = {
  avatar: 'avatar',
  color: 'color',
  username: 'username',
  channelAssets: {
    avatar: {
      url: 'https://d2rjmx7smzf4q7.cloudfront.net/0be3553d-9cde-5568-8e1c-d2b8ad1ad007/avatar?versionId=AfVhOqaUkzyjN0Fe1KsX2who34eloa45',
      sequencer: '006388DBA29BB82E37'
    },
    banner: {
      url: 'https://d2rjmx7smzf4q7.cloudfront.net/0be3553d-9cde-5568-8e1c-d2b8ad1ad007/banner?versionId=7tBpTPc3.b9Y.rAUdkP5TggAJDggTntL',
      sequencer: '006388DC03961B2663'
    }
  }
};
const MAX_RESULTS = 50;

describe('getFollowingChannels controller', () => {
  const server = buildServer();
  const mockConsoleError = jest.fn();
  const realConsoleError = console.error;

  beforeAll(() => {
    process.env.STREAM_TABLE_NAME = 'streamTableName';
    process.env.CHANNELS_TABLE_NAME = 'channelsTableName';
    process.env.REGION = 'region';
    process.env.ACCOUNT_ID = 'accountId';

    console.error = mockConsoleError;
  });

  afterAll(() => {
    delete process.env.STREAM_TABLE_NAME;
    delete process.env.CHANNELS_TABLE_NAME;
    delete process.env.REGION;
    delete process.env.ACCOUNT_ID;

    console.error = realConsoleError;
  });

  beforeEach(() => {
    mockDynamoDbClient.reset();
  });

  createRouteAuthenticationTests({ server, ...defaultRequestParams });

  describe('error handling', () => {
    it('should return an unexpected exception when the DynamoDB client fails', async () => {
      mockDynamoDbClient
        .on(ScanCommand, { TableName: 'streamTableName' })
        .rejects({});

      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams
      });

      const { __type } = JSON.parse(response.payload);

      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(500);
      expect(__type).toBe(UNEXPECTED_EXCEPTION);
    });
  });

  describe('general cases', () => {
    it('should return empty list if following list is empty', async () => {
      mockDynamoDbClient
        .on(GetItemCommand, { TableName: 'channelsTableName' })
        .resolves({
          Item: marshall({})
        });
      const response = await injectAuthorizedRequest(
        server,
        defaultRequestParams
      );
      const { channels, maxResults } = JSON.parse(response.payload);
      expect(maxResults).toBe(50);
      expect(channels.length).toBe(0);
    });

    it('should return an empty list of channels when the stream table returns undefined Items', async () => {
      mockDynamoDbClient
        .on(GetItemCommand, { TableName: 'channelsTableName' })
        .resolves({
          Item: marshall({ followingList: ['channelId'] })
        });
      mockDynamoDbClient
        .on(ScanCommand, { TableName: 'streamTableName' })
        .resolves({});

      const response = await injectAuthorizedRequest(
        server,
        defaultRequestParams
      );
      const { channels, maxResults } = JSON.parse(response.payload);

      expect(maxResults).toBe(50);
      expect(channels.length).toBe(0);
    });

    it('should include an isLive attribute for each channel data in the following list', async () => {
      mockDynamoDbClient
        .on(GetItemCommand, { TableName: 'channelsTableName' })
        .resolves({
          Item: marshall({
            followingList: [onlineStreamSessions[0].channelArn]
          })
        });
      mockDynamoDbClient
        .on(ScanCommand, {
          TableName: 'streamTableName'
        })
        .resolves({
          Items: [
            marshall({
              ...onlineStreamSessions[0],
              channelArn: buildChannelArn(onlineStreamSessions[0].channelArn)
            })
          ]
        });
      mockDynamoDbClient
        .on(QueryCommand, { TableName: 'channelsTableName' })
        .resolves({
          Items: [marshall({})]
        });

      const response = await injectAuthorizedRequest(
        server,
        defaultRequestParams
      );
      const { channels, maxResults } = JSON.parse(response.payload);

      expect(maxResults).toBe(50);
      expect(channels.length).toBe(1);
      expect(channels[0].isLive).toBeTruthy();
    });

    it('should sort the live channels by start time', async () => {
      mockDynamoDbClient
        .callsFakeOnce(({ TableName }) => {
          if (TableName === 'channelsTableName')
            return {
              Item: marshall({
                followingList: [
                  ...onlineStreamSessions.map(({ channelArn }) => {
                    return channelArn;
                  })
                ]
              })
            };

          throw new Error();
        })
        .callsFakeOnce(({ TableName }) => {
          if (TableName === 'streamTableName')
            return {
              Items: onlineStreamSessions.map((onlineStreamSession) => {
                return marshall({
                  ...onlineStreamSession,
                  channelArn: buildChannelArn(onlineStreamSession.channelArn)
                });
              })
            };

          throw new Error();
        })
        .callsFake(({ TableName, ExpressionAttributeValues }) => {
          for (let i = 0; i < onlineStreamSessions.length; i += 1) {
            const { channelArn } = onlineStreamSessions[i];
            if (
              TableName === 'channelsTableName' &&
              ExpressionAttributeValues[':channelArn'].S ===
                buildChannelArn(channelArn)
            )
              return {
                Items: [
                  marshall({
                    ...channelObject,
                    username: channelArn.split('channelArn-')[1]
                  })
                ]
              };
          }

          throw new Error();
        });

      const response = await injectAuthorizedRequest(
        server,
        defaultRequestParams
      );
      const { channels, maxResults } = JSON.parse(response.payload);
      expect(maxResults).toBe(50);
      expect(channels.length).toBe(5);
      expect(channels[0].username).toEqual('user5');
      expect(channels[1].username).toEqual('user2');
      expect(channels[2].username).toEqual('user1');
      expect(channels[3].username).toEqual('user4');
      expect(channels[4].username).toEqual('user3');
    });

    it('should sort the offline channels by most recently followed channel (newest following item is ordered left to right of the list)', async () => {
      mockDynamoDbClient
        .callsFakeOnce(({ TableName }) => {
          if (TableName === 'channelsTableName')
            return {
              Item: marshall({
                followingList: [
                  ...onlineStreamSessions.map(({ channelArn }) => channelArn),
                  ...offlineStreamSessions.map(({ channelArn }) => channelArn)
                ]
              })
            };

          throw new Error();
        })
        .callsFakeOnce(({ TableName }) => {
          if (TableName === 'streamTableName')
            return {
              Items: onlineStreamSessions.map((onlineStreamSession) => {
                return marshall({
                  ...onlineStreamSession,
                  channelArn: buildChannelArn(onlineStreamSession.channelArn)
                });
              })
            };

          throw new Error();
        })
        .callsFake(({ TableName, ExpressionAttributeValues }) => {
          for (let i = 0; i < offlineStreamSessions.length; i += 1) {
            const { channelArn } = offlineStreamSessions[i];
            if (
              TableName === 'channelsTableName' &&
              ExpressionAttributeValues[':channelArn'].S ===
                buildChannelArn(channelArn)
            )
              return {
                Items: [
                  marshall({
                    ...channelObject,
                    username: channelArn.split('offline-channelArn-')[1]
                  })
                ]
              };
          }

          throw new Error();
        });

      const response = await injectAuthorizedRequest(
        server,
        defaultRequestParams
      );
      const { channels, maxResults } = JSON.parse(response.payload);
      expect(maxResults).toBe(50);
      expect(channels.length).toBe(5);
      expect(channels[0].username).toEqual('user1');
      expect(channels[1].username).toEqual('user2');
      expect(channels[2].username).toEqual('user3');
      expect(channels[3].username).toEqual('user4');
      expect(channels[4].username).toEqual('user5');
    });

    it('when followed live channels is equal or more than max results(50), should return 50 live channels and 0 offline channels', async () => {
      const liveChannelIds = Array.from(
        { length: MAX_RESULTS },
        (_, i) => `liveChannelId-${i}`
      );
      const offlineChannelIds = Array.from(
        { length: 5 },
        (_, i) => `offlineChannelId-${i}`
      );

      const combinedLiveAndOfflineChannelIds = [
        ...liveChannelIds,
        ...offlineChannelIds
      ];

      mockDynamoDbClient
        .callsFakeOnce(({ TableName }) => {
          if (TableName === 'channelsTableName')
            return {
              Item: marshall({
                followingList: combinedLiveAndOfflineChannelIds
              })
            };

          throw new Error();
        })
        .callsFakeOnce(({ TableName }) => {
          if (TableName === 'streamTableName')
            return {
              Items: liveChannelIds.map((liveChannelId) => {
                return marshall({
                  channelArn: buildChannelArn(liveChannelId)
                });
              })
            };

          throw new Error();
        })
        .callsFake(({ TableName, ExpressionAttributeValues }) => {
          for (let i = 0; i < combinedLiveAndOfflineChannelIds.length; i += 1) {
            const channelArn = buildChannelArn(
              combinedLiveAndOfflineChannelIds[i]
            );
            if (
              TableName === 'channelsTableName' &&
              ExpressionAttributeValues[':channelArn'].S === channelArn
            )
              return {
                Items: [marshall(channelObject)]
              };
          }

          throw new Error();
        });

      const response = await injectAuthorizedRequest(
        server,
        defaultRequestParams
      );
      const { channels, maxResults } = JSON.parse(response.payload);
      expect(maxResults).toBe(50);
      expect(channels.length).toBe(50);

      channels.forEach((channel: ExtendedChannelDbRecord) => {
        expect(channel.isLive).toBeTruthy();
      });
    });

    it('when followed live channels has less than max results(50) and followed offline channels exceed max results(50), should return all the followed live channels and the rest should be offline channels', async () => {
      const liveChannelIds = Array.from(
        { length: 1 },
        (_, i) => `liveChannelId-${i}`
      );
      const offlineChannelIds = Array.from(
        { length: MAX_RESULTS },
        (_, i) => `offlineChannelId-${i}`
      );

      const combinedLiveAndOfflineChannelIds = [
        ...liveChannelIds,
        ...offlineChannelIds
      ];

      mockDynamoDbClient
        .callsFakeOnce(({ TableName }) => {
          if (TableName === 'channelsTableName')
            return {
              Item: marshall({
                followingList: combinedLiveAndOfflineChannelIds
              })
            };

          throw new Error();
        })
        .callsFakeOnce(({ TableName }) => {
          if (TableName === 'streamTableName')
            return {
              Items: liveChannelIds.map((liveChannelId) => {
                return marshall({
                  channelArn: buildChannelArn(liveChannelId)
                });
              })
            };

          throw new Error();
        })
        .callsFake(({ TableName, ExpressionAttributeValues }) => {
          for (let i = 0; i < combinedLiveAndOfflineChannelIds.length; i += 1) {
            const channelArn = buildChannelArn(
              combinedLiveAndOfflineChannelIds[i]
            );
            if (
              TableName === 'channelsTableName' &&
              ExpressionAttributeValues[':channelArn'].S === channelArn
            )
              return {
                Items: [marshall(channelObject)]
              };
          }

          throw new Error();
        });

      const response = await injectAuthorizedRequest(
        server,
        defaultRequestParams
      );
      const { channels, maxResults } = JSON.parse(response.payload);
      expect(maxResults).toBe(50);
      expect(channels.length).toBe(50);
      expect(channels[0].isLive).toBeTruthy();
      expect(channels[1].isLive).toBeFalsy();
      expect(channels[49].isLive).toBeFalsy();
    });

    it('when followed live channels has 0 results and followed offline channels exceed max results(50), should return no followed live channels and the number of max results(50) offline channels', async () => {
      const liveChannelIds = Array.from(
        { length: 0 },
        (_, i) => `liveChannelId-${i}`
      );
      const offlineChannelIds = Array.from(
        { length: MAX_RESULTS },
        (_, i) => `offlineChannelId-${i}`
      );

      const combinedLiveAndOfflineChannelIds = [
        ...liveChannelIds,
        ...offlineChannelIds
      ];

      mockDynamoDbClient
        .callsFakeOnce(({ TableName }) => {
          if (TableName === 'channelsTableName')
            return {
              Item: marshall({
                followingList: combinedLiveAndOfflineChannelIds
              })
            };

          throw new Error();
        })
        .callsFakeOnce(({ TableName }) => {
          if (TableName === 'streamTableName')
            return {
              Items: liveChannelIds.map((liveChannelId) => {
                return marshall({
                  channelArn: buildChannelArn(liveChannelId)
                });
              })
            };

          throw new Error();
        })
        .callsFake(({ TableName, ExpressionAttributeValues }) => {
          for (let i = 0; i < combinedLiveAndOfflineChannelIds.length; i += 1) {
            const channelArn = buildChannelArn(
              combinedLiveAndOfflineChannelIds[i]
            );
            if (
              TableName === 'channelsTableName' &&
              ExpressionAttributeValues[':channelArn'].S === channelArn
            )
              return {
                Items: [marshall(channelObject)]
              };
          }

          throw new Error();
        });

      const response = await injectAuthorizedRequest(
        server,
        defaultRequestParams
      );
      const { channels, maxResults } = JSON.parse(response.payload);
      expect(maxResults).toBe(50);
      expect(channels.length).toBe(50);
      channels.forEach((channel: ExtendedChannelDbRecord) => {
        expect(channel.isLive).toBeFalsy();
      });
    });
  });
});
