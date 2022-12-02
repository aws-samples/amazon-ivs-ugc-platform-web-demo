import 'aws-sdk-client-mock-jest';
import { DeleteObjectCommand, S3ServiceException } from '@aws-sdk/client-s3';
import {
  GetItemCommand,
  UpdateItemCommand,
  LimitExceededException
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';

import {
  createRouteAuthenticationTests,
  injectAuthorizedRequest
} from '../../../testUtils';
import { dynamoDbClient, s3Client } from '../../../shared/helpers';
import {
  UNEXPECTED_EXCEPTION,
  DELETE_CHANNEL_ASSET_EXCEPTION
} from '../../../shared/constants';
import buildServer from '../../../buildServer';

const mockDynamoDbClient = mockClient(dynamoDbClient);
const mockS3Client = mockClient(s3Client);
const url = '/channel/asset';
const defaultRequestParams = { method: 'DELETE' as const, url };
const defaultValidPayload = { assetType: 'avatar' };
const defaultUserData = {
  channelAssetId: 'd0fd7536-78c0-5c76-8164-c6ec2cf99027'
};

describe('deleteChannelAssets controller', () => {
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
    mockS3Client.reset();
    mockDynamoDbClient.reset();
    mockDynamoDbClient.on(GetItemCommand).resolves({
      Item: marshall(defaultUserData)
    });
  });

  createRouteAuthenticationTests({ server, ...defaultRequestParams });

  describe('error handling', () => {
    it('should return a delete channel asset exception when the assetType is missing', async () => {
      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams,
        payload: { ...defaultValidPayload, assetType: undefined }
      });

      const { __type } = JSON.parse(response.payload);

      expect(mockS3Client).not.toHaveReceivedCommand(DeleteObjectCommand);
      expect(mockDynamoDbClient).not.toHaveReceivedCommand(UpdateItemCommand);
      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(400);
      expect(__type).toBe(DELETE_CHANNEL_ASSET_EXCEPTION);
    });

    it('should return an unexpected exception and skip the DynamoDB update item command when the S3 delete object command fails', async () => {
      mockS3Client.on(DeleteObjectCommand).callsFakeOnce(() => {
        throw new S3ServiceException({
          name: 'S3ServiceException',
          $fault: 'server',
          $metadata: {}
        });
      });
      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams,
        payload: defaultValidPayload
      });

      const { __type } = JSON.parse(response.payload);
      const { exception: deleteObjectCommandException } =
        mockS3Client.commandCalls(DeleteObjectCommand)[0];

      expect(mockS3Client).toHaveReceivedCommand(DeleteObjectCommand);
      expect(
        mockS3Client.send.threw(deleteObjectCommandException)
      ).toBeTruthy();
      expect(mockDynamoDbClient).not.toHaveReceivedCommand(UpdateItemCommand);
      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(500);
      expect(__type).toBe(UNEXPECTED_EXCEPTION);
    });

    it('should return an unexpected exception when the DynamoDB update item command fails', async () => {
      mockDynamoDbClient.on(UpdateItemCommand).callsFakeOnce(() => {
        throw new LimitExceededException({
          message: 'Limit Exceeded',
          $metadata: {}
        });
      });
      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams,
        payload: defaultValidPayload
      });

      const { __type } = JSON.parse(response.payload);
      const { exception: updateItemCommandException } =
        mockDynamoDbClient.commandCalls(UpdateItemCommand)[0];

      expect(mockS3Client).toHaveReceivedCommand(DeleteObjectCommand);
      expect(mockDynamoDbClient).toHaveReceivedCommand(UpdateItemCommand);
      expect(
        mockDynamoDbClient.send.threw(updateItemCommandException)
      ).toBeTruthy();
      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(500);
      expect(__type).toBe(UNEXPECTED_EXCEPTION);
    });

    it('should return an unexpected exception when the user does not have a channel asset id assigned to them', async () => {
      mockDynamoDbClient.on(GetItemCommand).resolves({
        Item: {
          ...marshall(
            { ...defaultUserData, channelAssetId: undefined },
            { removeUndefinedValues: true }
          )
        }
      });
      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams,
        payload: defaultValidPayload
      });

      const { __type } = JSON.parse(response.payload);

      expect(mockS3Client).not.toHaveReceivedCommand(DeleteObjectCommand);
      expect(mockDynamoDbClient).not.toHaveReceivedCommand(UpdateItemCommand);
      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(500);
      expect(__type).toBe(UNEXPECTED_EXCEPTION);
    });

    it('should return a unexpected exception when no user record is returned', async () => {
      mockDynamoDbClient.on(GetItemCommand).resolves({ Item: undefined });
      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams,
        payload: defaultValidPayload
      });

      const { __type } = JSON.parse(response.payload);

      expect(mockS3Client).not.toHaveReceivedCommand(DeleteObjectCommand);
      expect(mockDynamoDbClient).not.toHaveReceivedCommand(UpdateItemCommand);
      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(500);
      expect(__type).toBe(UNEXPECTED_EXCEPTION);
    });
  });

  describe('general cases', () => {
    it('should successfully delete a channel asset from the Channel Assets bucket and the Channels table', async () => {
      const requestPayload = defaultValidPayload;
      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams,
        payload: requestPayload
      });

      const { returnValue } =
        mockDynamoDbClient.commandCalls(GetItemCommand)[0];
      const { Item = {} } = await returnValue;
      const { channelAssetId } = unmarshall(Item);

      expect(mockS3Client).toHaveReceivedCommandWith(DeleteObjectCommand, {
        Key: [channelAssetId, requestPayload.assetType].join('/')
      });
      expect(mockDynamoDbClient).toHaveReceivedCommand(UpdateItemCommand);
      expect(mockConsoleError).toHaveBeenCalledTimes(0);
      expect(response.statusCode).toBe(204);
    });
  });
});
