import { GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import s3PresignedPost from '@aws-sdk/s3-presigned-post';

import {
  createRouteAuthenticationTests,
  injectAuthorizedRequest
} from '../../../testUtils';
import { dynamoDbClient } from '../../../shared/helpers';
import {
  INVALID_PRESIGNED_POST_INPUT_EXCEPTION,
  UNEXPECTED_EXCEPTION
} from '../../../shared/constants';
import buildServer from '../../../buildServer';

const mockDynamoDbClient = mockClient(dynamoDbClient);
const url = '/channel/assets/imagePresignedPost/create';
const defaultRequestParams = { method: 'POST' as const, url };
const defaultValidPayload = {
  assetType: 'avatar',
  contentType: 'image/jpg'
};
const defaultUserData = {
  channelAssetId: 'd0fd7536-78c0-5c76-8164-c6ec2cf99027'
};
const channelAssetsBucketName = 'ugc-channels-channelassets';

jest.mock('@aws-sdk/s3-presigned-post', () => ({
  createPresignedPost: jest.fn(
    (_s3Client, { Bucket, Key, Fields: { acl: cannedAcl } }) => ({
      url: `https://${Bucket}.s3.us-west-2.amazonaws.com/`,
      fields: {
        acl: cannedAcl,
        bucket: Bucket,
        'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
        'X-Amz-Credential':
          'AKIAIOSFODNN7EXAMPLE/20221129/us-west-2/s3/aws4_request',
        'X-Amz-Date':
          new Date().toISOString().split('.')[0].replace(/(-|:)/g, '') + 'Z',
        'X-Amz-Security-Token': 'IQisudbiouisoduhf/sadfsdafasd+sdiopfsdha4334n',
        key: Key,
        Policy:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.YN5_EwCAOBuTPANx2p8HB6sxOZeUcp4l08XcjfAmCaY',
        'X-Amz-Signature':
          '733255ef022bec3f2a8701cd61d4b371f3f28c9f193a1f02279211d48d5193d7'
      }
    })
  )
}));
const mockedS3PresignedPost = s3PresignedPost as jest.Mocked<
  typeof s3PresignedPost
>;

describe('generatePresignedPost controller', () => {
  const server = buildServer();
  const mockConsoleError = jest.fn();
  const realConsoleError = console.error;
  const REAL_ENV = process.env;

  beforeAll(() => {
    console.error = mockConsoleError;
    process.env = {
      ...REAL_ENV,
      CHANNEL_ASSETS_BUCKET_NAME: channelAssetsBucketName
    };
  });

  afterAll(() => {
    console.error = realConsoleError;
    process.env = REAL_ENV;
  });

  beforeEach(() => {
    jest.resetModules();

    mockDynamoDbClient.reset();
    mockDynamoDbClient
      .on(GetItemCommand)
      .resolves({ Item: marshall(defaultUserData) });
  });

  createRouteAuthenticationTests({ server, ...defaultRequestParams });

  describe('error handling', () => {
    // Invalid maximum image file size
    [{ avatar: 0, banner: 5 }, {}].forEach(
      (invalidMaximumImageFileSizeConfig) => {
        it(`should return an invalid presigned post input exception when the maximum image file size is invalid for an assetType: ${invalidMaximumImageFileSizeConfig}`, async () => {
          let _buildServer: Function = buildServer;

          jest.isolateModules(() => {
            jest.mock('../../../shared/constants', () => ({
              ...jest.requireActual('../../../shared/constants'),
              MAXIMUM_IMAGE_FILE_SIZE: invalidMaximumImageFileSizeConfig
            }));

            _buildServer = require('../../../buildServer').default;
          });

          const _server = _buildServer();

          const response = await injectAuthorizedRequest(_server, {
            ...defaultRequestParams,
            payload: defaultValidPayload
          });

          const { __type } = JSON.parse(response.payload);

          expect(mockConsoleError).toHaveBeenCalledTimes(1);
          expect(response.statusCode).toBe(400);
          expect(__type).toBe(INVALID_PRESIGNED_POST_INPUT_EXCEPTION);
        });
      }
    );

    // Invalid asset type
    ['great-asset', undefined].forEach((invalidAssetType) => {
      it(`should return an invalid presigned post input exception when an invalid asset type is provided: ${invalidAssetType}`, async () => {
        const response = await injectAuthorizedRequest(server, {
          ...defaultRequestParams,
          payload: { ...defaultValidPayload, assetType: invalidAssetType }
        });

        const { __type } = JSON.parse(response.payload);

        expect(mockConsoleError).toHaveBeenCalledTimes(1);
        expect(response.statusCode).toBe(400);
        expect(__type).toBe(INVALID_PRESIGNED_POST_INPUT_EXCEPTION);
      });
    });

    // Invalid file format
    ['image/bmp', undefined].forEach((invalidContentType) => {
      it(`should return an invalid presigned post input exception when an invalid image content type is provided: ${invalidContentType}`, async () => {
        const response = await injectAuthorizedRequest(server, {
          ...defaultRequestParams,
          payload: { ...defaultValidPayload, contentType: invalidContentType }
        });

        const { __type } = JSON.parse(response.payload);

        expect(mockConsoleError).toHaveBeenCalledTimes(1);
        expect(response.statusCode).toBe(400);
        expect(__type).toBe(INVALID_PRESIGNED_POST_INPUT_EXCEPTION);
      });
    });

    it('should return an unexpected response when createPresignedPost fails', async () => {
      mockedS3PresignedPost.createPresignedPost.mockImplementationOnce(() => {
        throw new Error('InvalidRequest');
      });

      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams,
        payload: defaultValidPayload
      });

      const { __type } = JSON.parse(response.payload);

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

      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(500);
      expect(__type).toBe(UNEXPECTED_EXCEPTION);
    });
  });

  describe('general cases', () => {
    it('should successfully generate an image Presigned Post', async () => {
      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams,
        payload: defaultValidPayload
      });

      const { url, fields } = JSON.parse(response.payload);
      const [urlBucketName] = new URL(url).host.split('.');
      const [channelAssetId] = fields.key.split('/');

      expect(urlBucketName).toBe(channelAssetsBucketName);
      expect(channelAssetId).toBe(defaultUserData.channelAssetId);
      expect(Object.keys(fields)).toEqual(
        expect.arrayContaining([
          'acl',
          'bucket',
          'key',
          'Policy',
          'X-Amz-Algorithm',
          'X-Amz-Credential',
          'X-Amz-Date',
          'X-Amz-Security-Token',
          'X-Amz-Signature'
        ])
      );
      expect(mockConsoleError).toHaveBeenCalledTimes(0);
      expect(response.statusCode).toBe(200);
    });
  });
});
