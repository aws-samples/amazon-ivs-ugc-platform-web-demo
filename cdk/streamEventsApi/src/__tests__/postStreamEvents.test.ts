import { unmarshall } from '@aws-sdk/util-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import {
  UpdateItemCommand,
  GetItemCommandOutput
} from '@aws-sdk/client-dynamodb';

import * as sharedHelpers from '../helpers';
import buildServer from '../buildServer';
import {
  SESSION_CREATED,
  STREAM_END,
  STREAM_HEALTH_CHANGE_EVENT_TYPE,
  UNEXPECTED_EXCEPTION
} from '../constants';

const mockUserData = {
  chatRoomArn: 'chatRoomArn',
  username: 'username',
  channelArn: 'channelArn',
  $metadata: {},
  id: 'id'
};

// Default request body
const requestBody = {
  'detail-type': STREAM_HEALTH_CHANGE_EVENT_TYPE,
  detail: {
    event_name: SESSION_CREATED,
    limit_name: 'test',
    stream_id: 'STREAM_ID'
  },
  time: '1686170708',
  resources: ['channelArn']
};

// Mock unmarshall
jest.mock('@aws-sdk/util-dynamodb', () => ({
  ...jest.requireActual('@aws-sdk/util-dynamodb'),
  unmarshall: jest.fn()
}));

// Mock DynamoDB Commands
const getUserByChannelArnSpy = jest.spyOn(sharedHelpers, 'getUserByChannelArn');
const mockGetUserByChannelArn = (mockData: Promise<GetItemCommandOutput>) =>
  getUserByChannelArnSpy.mockImplementation(() => mockData);

const getStreamEventsSpy = jest.spyOn(sharedHelpers, 'getStreamEvents');
const mockGetStreamEvents = (mockData: Promise<sharedHelpers.StreamEvent[]>) =>
  getStreamEventsSpy.mockImplementation(() => mockData);

const getStreamsByChannelArnSpy = jest.spyOn(
  sharedHelpers,
  'getStreamsByChannelArn'
);
const mockGetStreamsByChannelArn = (mockData: Promise<GetItemCommandOutput>) =>
  getStreamsByChannelArnSpy.mockImplementation(() => mockData);

const updateStreamSessionToOfflineSpy = jest.spyOn(
  sharedHelpers,
  'updateStreamSessionToOffline'
);

const updateStreamEventsSpy = jest.spyOn(sharedHelpers, 'updateStreamEvents');

// Create mock DynamoDB client
const dynamoDbClient = sharedHelpers.dynamoDbClient;
const mockDynamoDbClient = mockClient(dynamoDbClient);

describe('postStreamEvents', () => {
  const server = buildServer();
  const mockConsoleError = jest.fn();
  const realConsoleError = console.error;

  const mockPostStreamEventsApi = async (_requestBody: {
    'detail-type': string;
    detail: { event_name: string; limit_name?: string; stream_id?: string };
    time: string;
    resources: string[];
  }) => {
    mockGetUserByChannelArn(
      Promise.resolve({
        Items: [{ username: 'username', id: 'id' }],
        $metadata: {}
      })
    );
    (unmarshall as jest.Mock).mockImplementation(() => mockUserData);

    mockGetStreamEvents(
      Promise.resolve([
        {
          eventTime: '2023-06-14T18:32:41Z',
          name: SESSION_CREATED,
          type: 'IVS Stream State Change'
        }
      ])
    );

    mockGetStreamsByChannelArn(
      Promise.resolve({
        Items: [
          {
            id: 'id',
            channelArn: 'channelArn'
          }
        ],
        $metadata: {}
      })
    );
    (unmarshall as jest.Mock).mockImplementation(() => ({
      id: 'STREAM_ID',
      channelArn: 'channelArn'
    }));

    return await server.inject({
      method: 'POST',
      url: '/',
      payload: _requestBody
    });
  };

  beforeAll(() => {
    console.error = mockConsoleError;
  });

  afterAll(() => {
    console.error = realConsoleError;
  });

  beforeEach(() => {
    mockDynamoDbClient.reset();

    process.env = {
      STREAM_TABLE_NAME: 'streamTableName'
    };
    mockDynamoDbClient.on(UpdateItemCommand).resolves({});
    mockConsoleError.mockClear();
  });

  describe('Error handling', () => {
    it('should return a 500 status and UnexpectedException error response when getUserByChannelArn throws an error', async () => {
      getUserByChannelArnSpy.mockRejectedValue(
        new Error('something went wrong')
      );
      const response = await server.inject({
        method: 'POST',
        url: '/',
        payload: requestBody
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({ __type: UNEXPECTED_EXCEPTION });
    });

    it('should return a 500 status and UnexpectedException error response when getStreamEvents throws an error', async () => {
      mockGetUserByChannelArn(
        Promise.resolve({
          Items: [{ username: 'username', id: 'id' }],
          $metadata: {}
        })
      );
      (unmarshall as jest.Mock).mockImplementation(() => mockUserData);

      getStreamEventsSpy.mockRejectedValue(new Error('something went wrong'));

      const response = await server.inject({
        method: 'POST',
        url: '/',
        payload: requestBody
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({ __type: UNEXPECTED_EXCEPTION });
    });

    it('should return a 500 status and UnexpectedException error response when getStreamsByChannelArn throws an error', async () => {
      mockGetUserByChannelArn(
        Promise.resolve({
          Items: [{ username: 'username', id: 'id' }],
          $metadata: {}
        })
      );
      (unmarshall as jest.Mock).mockImplementation(() => mockUserData);

      mockGetStreamEvents(
        Promise.resolve([
          {
            eventTime: '2023-06-14T18:32:41Z',
            name: SESSION_CREATED,
            type: 'IVS Stream State Change'
          }
        ])
      );

      getStreamsByChannelArnSpy.mockRejectedValue(
        new Error('something went wrong')
      );

      const response = await server.inject({
        method: 'POST',
        url: '/',
        payload: requestBody
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({ __type: UNEXPECTED_EXCEPTION });
    });
  });

  describe(SESSION_CREATED, () => {
    beforeAll(() => {
      requestBody.detail.event_name = SESSION_CREATED;
    });

    it('should return a 200 status code when all dynamoDB are successful', async () => {
      const response = await mockPostStreamEventsApi(requestBody);

      expect(updateStreamSessionToOfflineSpy).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
    });

    it('should have called updateStreamEvents with correct arguments', async () => {
      const expectedFuncArgument = {
        attributesToRemove: [],
        additionalAttributes: {
          isHealthy: true,
          hasErrorEvent: false,
          isOpen: 'true',
          startTime: '1686170708'
        },
        channelArn: 'channelArn',
        streamEvents: [
          {
            eventTime: '1686170708',
            name: 'test',
            type: STREAM_HEALTH_CHANGE_EVENT_TYPE
          },
          {
            eventTime: '2023-06-14T18:32:41Z',
            name: SESSION_CREATED,
            type: 'IVS Stream State Change'
          }
        ],
        streamId: 'STREAM_ID',
        userSub: 'STREAM_ID'
      };

      await mockPostStreamEventsApi(requestBody);

      expect(updateStreamEventsSpy).toHaveBeenCalledWith(expectedFuncArgument);
    });

    it('when live stream with same channelArn exists, should set old live stream as offline', async () => {
      mockGetUserByChannelArn(
        Promise.resolve({
          Items: [{ username: 'username', id: 'id', channelArn: 'channelArn' }],
          $metadata: {}
        })
      );
      (unmarshall as jest.Mock).mockImplementation(() => mockUserData);

      mockGetStreamEvents(
        Promise.resolve([
          {
            eventTime: '2023-06-14T18:32:41Z',
            name: SESSION_CREATED,
            type: 'IVS Stream State Change'
          }
        ])
      );

      mockGetStreamsByChannelArn(
        Promise.resolve({
          Items: [
            {
              id: 'id',
              channelArn: 'channelArn',
              isOpen: 'true'
            }
          ],
          $metadata: {}
        })
      );
      (unmarshall as jest.Mock).mockImplementation(() => ({
        id: 'OLD_STREAM_ID',
        channelArn: 'channelArn',
        isOpen: 'true'
      }));

      const response = await server.inject({
        method: 'POST',
        url: '/',
        payload: requestBody
      });

      expect(updateStreamSessionToOfflineSpy).toHaveBeenCalledWith({
        channelArn: 'channelArn',
        streamId: 'OLD_STREAM_ID'
      });
      expect(response.statusCode).toBe(200);
    });
  });

  describe('STREAM_END', () => {
    beforeAll(() => {
      requestBody.detail.event_name = STREAM_END;
    });

    it('should return a 200 status code when all dynamoDB are successful', async () => {
      const response = await mockPostStreamEventsApi(requestBody);

      expect(response.statusCode).toBe(200);
    });

    it('should not call updateStreamSessionToOffline', async () => {
      await mockPostStreamEventsApi(requestBody);

      expect(updateStreamSessionToOfflineSpy).not.toHaveBeenCalled();
    });

    it('should have called updateStreamEvents with correct arguments', async () => {
      const expectedFuncArgument = {
        attributesToRemove: ['isOpen'],
        additionalAttributes: {
          endTime: '1686170708',
          isHealthy: true
        },
        channelArn: 'channelArn',
        streamEvents: [
          {
            eventTime: '1686170708',
            name: 'test',
            type: STREAM_HEALTH_CHANGE_EVENT_TYPE
          },
          {
            eventTime: '2023-06-14T18:32:41Z',
            name: SESSION_CREATED,
            type: 'IVS Stream State Change'
          }
        ],
        streamId: 'STREAM_ID',
        userSub: 'STREAM_ID'
      };

      await mockPostStreamEventsApi(requestBody);

      expect(updateStreamEventsSpy).toHaveBeenCalledWith(expectedFuncArgument);
    });
  });
});
