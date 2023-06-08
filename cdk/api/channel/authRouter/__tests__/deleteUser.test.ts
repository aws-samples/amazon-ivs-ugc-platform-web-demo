import {
  AdminDeleteUserCommand,
  AdminDisableUserCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { DeleteItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { DeleteRoomCommand } from '@aws-sdk/client-ivschat';
import { marshall } from '@aws-sdk/util-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import {
  ChannelNotBroadcasting,
  DeleteChannelCommand,
  StopStreamCommand
} from '@aws-sdk/client-ivs';

import { ACCOUNT_DELETION_EXCEPTION } from '../../../shared/constants';
import {
  cognitoClient,
  dynamoDbClient,
  ivsChatClient,
  ivsClient,
  s3Client
} from '../../../shared/helpers';
import {
  createRouteAuthenticationTests,
  injectAuthorizedRequest
} from '../../../testUtils';
import buildServer from '../../../buildServer';
import { DeleteObjectsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

const mockCognitoClient = mockClient(cognitoClient);
const mockDynamoDbClient = mockClient(dynamoDbClient);
const mockIvsChatClient = mockClient(ivsChatClient);
const mockIvsClient = mockClient(ivsClient);
const mockS3Client = mockClient(s3Client);

const url = '/channel';
const defaultRequestParams = { method: 'DELETE' as const, url };
const defaultUserData = {
  channelArn: 'channelArn',
  chatRoomArn: 'chatRoomArn',
  channelAssetId: 'channelAssetId'
};

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
      Item: marshall(defaultUserData)
    });

    mockS3Client.reset();
    mockS3Client.on(ListObjectsV2Command).resolves({
      Contents: [
        { Key: [defaultUserData.channelAssetId, 'avatar'].join('/') },
        { Key: [defaultUserData.channelAssetId, 'banner'].join('/') }
      ]
    });

    mockCognitoClient.reset();
    mockIvsChatClient.reset();
    mockIvsClient.reset();
  });

  createRouteAuthenticationTests({ server, ...defaultRequestParams });

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

    it('should return an account deletion exception when deleting the channel asset S3 objects fails', async () => {
      mockS3Client.on(DeleteObjectsCommand).rejectsOnce();

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
      mockIvsClient.on(StopStreamCommand).rejects(
        new ChannelNotBroadcasting({
          message: 'The stream is offline for the given channel ARN.',
          $metadata: {}
        })
      );

      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams
      });

      expect(mockConsoleError).toHaveBeenCalledTimes(0);
      expect(response.statusCode).toBe(204);
    });
  });

  it('should successfully stop the stream and delete the account', async () => {
    const response = await injectAuthorizedRequest(server, {
      ...defaultRequestParams
    });

    expect(mockConsoleError).toHaveBeenCalledTimes(0);
    expect(response.statusCode).toBe(204);
  });

  it('should successfully delete the account even if the database entry is missing', async () => {
    mockDynamoDbClient.on(GetItemCommand).resolves({});

    const response = await injectAuthorizedRequest(server, {
      ...defaultRequestParams
    });

    expect(mockConsoleError).toHaveBeenCalledTimes(0);
    expect(response.statusCode).toBe(204);
  });

  it('should successfully delete the account even if no channel assets were saved in the S3 bucket', async () => {
    mockS3Client.on(ListObjectsV2Command).resolvesOnce({ Contents: [] });

    const response = await injectAuthorizedRequest(server, {
      ...defaultRequestParams
    });

    expect(mockConsoleError).toHaveBeenCalledTimes(0);
    expect(response.statusCode).toBe(204);
  });
});
