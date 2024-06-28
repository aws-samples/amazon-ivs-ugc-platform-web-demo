import {
  GetItemCommandOutput,
  UpdateItemCommand
} from '@aws-sdk/client-dynamodb';
import {
  DisconnectUserCommand,
  SendEventCommand
} from '@aws-sdk/client-ivschat';
import { mockClient } from 'aws-sdk-client-mock';

import buildServer from '../../../buildServer';
import {
  BAN_USER_EXCEPTION,
  UNEXPECTED_EXCEPTION,
  USER_NOT_FOUND_EXCEPTION
} from '../../../shared/constants';
import {
  createRouteAuthenticationTests,
  injectAuthorizedRequest
} from '../../../testUtils';
import { dynamoDbClient, ivsChatClient } from '../../../shared/helpers';
import * as helpers from '../../helpers';
import * as sharedHelpers from '../../../shared/helpers';

const mockUserData = {
  chatRoomArn: 'chatRoomArn',
  username: 'username',
  channelArn: 'channelArn',
  id: 'id',
  $metadata: {}
};

const getUserSpy = jest.spyOn(helpers, 'getUser');
const mockGetUser = (mockData: Promise<GetItemCommandOutput>) =>
  getUserSpy.mockImplementation(() => mockData);

const getUserByChannelArnSpy = jest.spyOn(sharedHelpers, 'getUserByChannelArn');
const mockGetUserByChannelArn = (mockData: Promise<GetItemCommandOutput>) =>
  getUserByChannelArnSpy.mockImplementation(() => mockData);

jest.mock('@aws-sdk/util-dynamodb', () => ({
  ...jest.requireActual('@aws-sdk/util-dynamodb'),
  unmarshall: () => mockUserData
}));

const mockDynamoDbClient = mockClient(dynamoDbClient);
const mockIvsChatClient = mockClient(ivsChatClient);

const url = '/channel/ban';
const defaultRequestParams = { method: 'POST' as const, url };

describe('banUser handler', () => {
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
    mockDynamoDbClient.on(UpdateItemCommand).resolves({});
    mockIvsChatClient.reset();
    mockConsoleError.mockClear();
  });

  createRouteAuthenticationTests({ server, ...defaultRequestParams });

  describe('error handling', () => {
    it('should return a 400 status code and UNEXPECTED_EXCEPTION error response when bannedChannelArn is not provided', async () => {
      mockGetUser(Promise.resolve(mockUserData));
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
        `Missing bannedChannelArn for the channel owned by the user ${username}`
      );
    });

    it('should return a 400 status code and UNEXPECTED_EXCEPTION error response when a user tries to ban themselves', async () => {
      mockGetUser(Promise.resolve(mockUserData));
      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams,
        payload: { bannedChannelArn: 'channelArn' }
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({ __type: UNEXPECTED_EXCEPTION });
      expect(mockConsoleError).toHaveBeenCalledWith(
        'A user is not allowed to ban themselves from their own channel'
      );
    });

    it('should return a 500 status code and UNEXPECTED_EXCEPTION error response when getUser throws an error', async () => {
      getUserSpy.mockRejectedValue(new Error('something went wrong'));
      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams,
        payload: { bannedChannelArn: 'channelArn' }
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({ __type: UNEXPECTED_EXCEPTION });
    });

    it('should return a 404 status code and USER_NOT_FOUND_EXCEPTION error response when there is no BannedUserItems (empty array)', async () => {
      mockGetUser(Promise.resolve(mockUserData));
      mockGetUserByChannelArn(
        Promise.resolve({
          Items: [],
          $metadata: {}
        })
      );
      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams,
        payload: { bannedChannelArn: 'bannedChannelArn' }
      });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({ __type: USER_NOT_FOUND_EXCEPTION });
      expect(mockConsoleError).toHaveBeenCalledWith(
        'No user exists with the bannedChannelArn bannedChannelArn'
      );
    });

    it('should return a 500 status code and UNEXPECTED_EXCEPTION error response when getUserByChannelArn throws an error', async () => {
      mockGetUser(Promise.resolve(mockUserData));
      getUserByChannelArnSpy.mockRejectedValue(
        new Error('something went wrong')
      );
      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams,
        payload: { bannedChannelArn: 'bannedChannelArn' }
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({ __type: BAN_USER_EXCEPTION });
    });
  });

  describe('general case', () => {
    it('should successfully ban a user from a chat room. It should respond with status code 200 and an empty object', async () => {
      mockGetUser(Promise.resolve(mockUserData));
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
