import {
  ChannelNotBroadcasting,
  DeleteChannelCommand,
  StopStreamCommand
} from '@aws-sdk/client-ivs';
import {
  AdminDeleteUserCommand,
  AdminDisableUserCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { DeleteItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { DeleteRoomCommand } from '@aws-sdk/client-ivschat';
import { marshall } from '@aws-sdk/util-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';

import {
  cognitoClient,
  dynamoDbClient,
  ivsChatClient,
  ivsClient
} from '../../../shared/helpers';
import { ACCOUNT_DELETION_EXCEPTION } from '../../../shared/constants';
import { injectAuthorizedRequest } from '../../../testUtils';
import buildServer from '../../../buildServer';

const mockDynamoDbClient = mockClient(dynamoDbClient);
const mockCognitoClient = mockClient(cognitoClient);
const mockIvsClient = mockClient(ivsClient);
const mockIvsChatClient = mockClient(ivsChatClient);
const route = '/user';
const defaultRequestParams = { method: 'DELETE' as const, url: route };

describe('deleteUser controller', () => {
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
    mockDynamoDbClient.reset();
    mockDynamoDbClient.on(GetItemCommand).resolves({
      Item: marshall({
        channelArn: 'channelArn',
        chatRoomArn: 'chatRoomArn'
      })
    });

    mockIvsClient.reset();
    mockIvsChatClient.reset();
    mockCognitoClient.reset();
  });

  describe('error handling', () => {
    it('should return an account deletion exception when the stream fails to be stopped', async () => {
      mockIvsClient.on(StopStreamCommand).rejects();

      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams
      });

      const { __type } = JSON.parse(response.payload);

      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(500);
      expect(__type).toBe(ACCOUNT_DELETION_EXCEPTION);
    });

    it('should return an account deletion exception when deleting the Dynamo entry fails', async () => {
      mockDynamoDbClient.on(DeleteItemCommand).rejects();

      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams
      });

      const { __type } = JSON.parse(response.payload);

      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(500);
      expect(__type).toBe(ACCOUNT_DELETION_EXCEPTION);
    });

    it('should return an account deletion exception when deleting the IVS channel fails', async () => {
      mockIvsClient.on(DeleteChannelCommand).rejects();

      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams
      });

      const { __type } = JSON.parse(response.payload);

      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(500);
      expect(__type).toBe(ACCOUNT_DELETION_EXCEPTION);
    });

    it('should return an account deletion exception when deleting the IVS chat room fails', async () => {
      mockIvsChatClient.on(DeleteRoomCommand).rejects();

      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams
      });

      const { __type } = JSON.parse(response.payload);

      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(500);
      expect(__type).toBe(ACCOUNT_DELETION_EXCEPTION);
    });

    it('should return an account deletion exception when disabling the Cognito user fails', async () => {
      mockCognitoClient.on(AdminDisableUserCommand).rejects();

      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams
      });

      const { __type } = JSON.parse(response.payload);

      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(500);
      expect(__type).toBe(ACCOUNT_DELETION_EXCEPTION);
    });

    it('should return an account deletion exception when deleting the Cognito user fails', async () => {
      mockCognitoClient.on(AdminDeleteUserCommand).rejects();

      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams
      });

      const { __type } = JSON.parse(response.payload);

      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(500);
      expect(__type).toBe(ACCOUNT_DELETION_EXCEPTION);
    });
  });

  describe('general cases', () => {
    it('should successfully delete the account', async () => {
      mockIvsClient
        .on(StopStreamCommand)
        .rejects(new ChannelNotBroadcasting({ $metadata: {} }));

      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams
      });

      expect(mockConsoleError).toHaveBeenCalledTimes(0);
      expect(response.statusCode).toBe(200);
    });
  });

  it('should successfully stop the stream and delete the account', async () => {
    const response = await injectAuthorizedRequest(server, {
      ...defaultRequestParams
    });

    expect(mockConsoleError).toHaveBeenCalledTimes(0);
    expect(response.statusCode).toBe(200);
  });

  it('should successfully delete the account even if the database entry is missing', async () => {
    mockDynamoDbClient.on(GetItemCommand).resolves({});

    const response = await injectAuthorizedRequest(server, {
      ...defaultRequestParams
    });

    expect(mockConsoleError).toHaveBeenCalledTimes(0);
    expect(response.statusCode).toBe(200);
  });
});
