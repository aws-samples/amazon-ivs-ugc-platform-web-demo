import {
  GetItemCommandOutput,
  UpdateItemCommand
} from '@aws-sdk/client-dynamodb';
import * as helpers from '../../../shared/helpers';
import buildServer from '../../../buildServer';
import { dynamoDbClient, ivsChatClient } from '../../../shared/helpers';
import {
  createRouteAuthenticationTests,
  injectAuthorizedRequest
} from '../../../testUtils';
import { mockClient } from 'aws-sdk-client-mock';
import {
  UNBAN_USER_EXCEPTION,
  UNEXPECTED_EXCEPTION,
  USER_NOT_FOUND_EXCEPTION
} from '../../../shared/constants';

const mockUserData = {
  chatRoomArn: 'chatRoomArn',
  username: 'username',
  channelArn: 'channelArn',
  $metadata: {},
  id: 'id'
};

const getUserByChannelArnSpy = jest.spyOn(helpers, 'getUserByChannelArn');
const mockGetUserByChannelArn = (mockData: Promise<GetItemCommandOutput>) =>
  getUserByChannelArnSpy.mockImplementation(() => mockData);

jest.mock('@aws-sdk/util-dynamodb', () => ({
  ...jest.requireActual('@aws-sdk/util-dynamodb'),
  unmarshall: () => mockUserData
}));

const mockDynamoDbClient = mockClient(dynamoDbClient);
const mockIvsChatClient = mockClient(ivsChatClient);

const url = '/channel/unban';
const defaultRequestParams = { method: 'POST' as const, url };
const channelArn = 'channelArn';

describe('unbanUser handler', () => {
  const server = buildServer();
  const mockConsoleError = jest.fn();
  const realConsoleError = console.error;

  beforeAll(() => {
    console.error = mockConsoleError;
  });

  afterAll(() => {
    console.error = realConsoleError;
  });

  beforeEach(() => {
    process.env = {
      CHANNELS_TABLE_NAME: 'CHANNELS_TABLE_NAME'
    };
    jest.resetAllMocks();
    mockDynamoDbClient.reset();
    mockIvsChatClient.reset();
    mockConsoleError.mockClear();
  });

  createRouteAuthenticationTests({ server, ...defaultRequestParams });

  describe('error handling', () => {
    it('should return a 400 status code and UNEXPECTED_EXCEPTION error response when bannedChannelArn is not provided', async () => {
      mockGetUserByChannelArn(Promise.resolve(mockUserData));
      const { username } = mockUserData;
      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams,
        payload: {
          bannedChannelArn: undefined
        }
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({ __type: UNEXPECTED_EXCEPTION });
      expect(mockConsoleError).toHaveBeenCalledWith(
        `Missing bannedUsername for the channel owned by the user ${username}`
      );
    });

    it('should return a 404 status code and USER_NOT_FOUND_EXCEPTION error response when there is no user exist with the bannedChannelArn', async () => {
      mockGetUserByChannelArn(
        Promise.resolve({
          $metadata: {},
          Items: []
        })
      );
      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams,
        payload: { bannedChannelArn: channelArn }
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({ __type: USER_NOT_FOUND_EXCEPTION });
      expect(mockConsoleError).toHaveBeenCalledWith(
        `No user exists with the bannedChannelArn ${channelArn}`
      );
    });

    it('should return a 500 status code and UNBAN_USER_EXCEPTION error response when getUserByChannelArn throws an error', async () => {
      getUserByChannelArnSpy.mockRejectedValue(
        new Error('something went wrong')
      );
      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams,
        payload: { bannedChannelArn: 'channelArn' }
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({ __type: UNBAN_USER_EXCEPTION });
    });
  });

  describe('general case', () => {
    it('should successfully unban a user. It should respond with status code 200 and an empty object', async () => {
      mockDynamoDbClient.on(UpdateItemCommand).resolves({});
      mockGetUserByChannelArn(
        Promise.resolve({
          Items: [{ username: 'username', id: 'id' }],
          $metadata: {}
        })
      );
      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams,
        payload: { bannedChannelArn: 'bannedChannelArn' }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({});
    });
  });
});
