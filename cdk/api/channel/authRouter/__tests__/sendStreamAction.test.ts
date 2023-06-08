import {
  AccessDeniedException,
  ChannelNotBroadcasting,
  PutMetadataCommand,
  ThrottlingException,
  ValidationException
} from '@aws-sdk/client-ivs';
import { GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';

import {
  CHANNEL_NOT_BROADCASTING_EXCEPTION,
  TIMED_METADATA_EXCEPTION,
  TIMED_METADATA_VALIDATION_EXCEPTION,
  UNEXPECTED_EXCEPTION
} from '../../../shared/constants';
import { dynamoDbClient, ivsClient } from '../../../shared/helpers';
import {
  createRouteAuthenticationTests,
  injectAuthorizedRequest
} from '../../../testUtils';
import buildServer from '../../../buildServer';

const mockIvsClient = mockClient(ivsClient);
const mockDynamoDbClient = mockClient(dynamoDbClient);
const url = '/channel/actions/send';
const defaultRequestParams = { method: 'POST' as const, url };
const defaultValidPayload = { metadata: 'N4XyAA==' };
const defaultUserData = {
  channelArn: 'arn:aws:ivs:us-west-2:0123456789:channel/a1b2c3d4e5f6'
};

const throttlingExceptionResponse = new ThrottlingException({
  message:
    'Operation: ivs:PutMetadata exceeded call rate: 5 for resource: arn:aws:ivs:us-west-2:0123456789:channel/a1b2c3d4e5f6',
  $metadata: {
    httpStatusCode: 429,
    requestId: '2e82a2bb-dac0-4c71-a5c5-c333df5cf0b8',
    extendedRequestId: undefined,
    cfId: 'xMMvrLpmmEoFwQdCSOnK_Exiu-6gfq476H4uuQWsswEevWIL2_quvA==',
    attempts: 3,
    totalRetryDelay: 2260
  }
});

describe('sendStreamAction controller', () => {
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
    mockIvsClient.reset();

    mockDynamoDbClient.reset();
    mockDynamoDbClient.on(GetItemCommand).resolves({
      Item: marshall(defaultUserData)
    });
  });

  createRouteAuthenticationTests({ server, ...defaultRequestParams });

  describe('error handling', () => {
    it('should retry sending a timed metadata event when receiving a throttling exception and fail', async () => {
      mockIvsClient.on(PutMetadataCommand).rejects(throttlingExceptionResponse);

      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams,
        payload: defaultValidPayload
      });
      const { __type } = JSON.parse(response.payload);

      expect(mockConsoleError).toHaveBeenCalledWith(
        throttlingExceptionResponse
      );
      expect(response.statusCode).toBe(500);
      expect(__type).toBe(TIMED_METADATA_EXCEPTION);
    });

    it('should return a ChannelNotBroadcasting exception when the stream is offline', async () => {
      const channelNotBroadcastingExceptionResponse =
        new ChannelNotBroadcasting({
          message:
            'ChannelNotBroadcasting: Channel: arn:aws:ivs:us-west-2:0123456789:channel/a1b2c3d4e5f6 is not currently online',
          $metadata: {
            httpStatusCode: 404,
            requestId: '0929770b-367e-4f01-ad74-e667e8c280df',
            extendedRequestId: undefined,
            cfId: '5QWQq_Pvo0mKbd5atjUYuKZNx4-I0w6Pj6j0fts6hTyefJS5hso5yQ==',
            attempts: 1,
            totalRetryDelay: 0
          }
        });

      mockIvsClient
        .on(PutMetadataCommand)
        .rejects(channelNotBroadcastingExceptionResponse);

      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams,
        payload: defaultValidPayload
      });
      const { __type } = JSON.parse(response.payload);

      expect(mockConsoleError).toHaveBeenCalledWith(
        channelNotBroadcastingExceptionResponse
      );
      expect(response.statusCode).toBe(500);
      expect(__type).toBe(CHANNEL_NOT_BROADCASTING_EXCEPTION);
    });

    it('should return a timed metadata validation exception when the metadata payload fails validation', async () => {
      const validationExceptionResponse = new ValidationException({
        message: 'Metadata size exceeds payload limit',
        $metadata: {
          httpStatusCode: 400,
          requestId: '1afa767d-5fb3-4aba-b743-ff57a58686f1',
          extendedRequestId: undefined,
          cfId: 'CWEPKRNNyu-HUUYdVl_zQ-z0v2voFHIXch0Y65MxqNKL_htqM4UPuA==',
          attempts: 1,
          totalRetryDelay: 0
        }
      });

      mockIvsClient.on(PutMetadataCommand).rejects(validationExceptionResponse);

      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams,
        payload: {
          metadata: 'A metadata payload string that exceeds the payload limit'
        }
      });
      const { __type } = JSON.parse(response.payload);

      expect(mockConsoleError).toHaveBeenCalledWith(
        validationExceptionResponse
      );
      expect(response.statusCode).toBe(400);
      expect(__type).toBe(TIMED_METADATA_VALIDATION_EXCEPTION);
    });

    it('should return a timed metadata exception when the IVS client fails', async () => {
      const accessDeniedExceptionResponse = new AccessDeniedException({
        message:
          'User: arn:aws:iam::0123456789:user/janeDoe is not authorized to perform: ivs:PutMetadata on resource: arn:aws:ivs:us-west-2:0123456789:channel/a1b2c3d4e5f6',
        $metadata: {
          httpStatusCode: 403,
          requestId: '16a6eead-727f-4286-a768-f2f24f3323c4',
          extendedRequestId: undefined,
          cfId: '2UCrRPr61IHFZVZ0ZEuJsdgb3rlx8vW1bLWvhy4rFCNizWWPobs-hA==',
          attempts: 1,
          totalRetryDelay: 0
        }
      });

      mockIvsClient
        .on(PutMetadataCommand)
        .rejects(accessDeniedExceptionResponse);

      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams,
        payload: defaultValidPayload
      });
      const { __type } = JSON.parse(response.payload);

      expect(mockConsoleError).toHaveBeenCalledWith(
        accessDeniedExceptionResponse
      );
      expect(response.statusCode).toBe(500);
      expect(__type).toBe(TIMED_METADATA_EXCEPTION);
    });

    it('should return an unexpected exception when metadata payload is missing', async () => {
      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams,
        payload: { metadata: '' }
      });

      const { __type } = JSON.parse(response.payload);

      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(400);
      expect(__type).toBe(UNEXPECTED_EXCEPTION);
    });

    it('should return a validation exception when metadata payload is missing', async () => {
      const validationExceptionResponse = new ValidationException({
        message: 'PutMetadata.channelArn is a required attribute',
        $metadata: {
          httpStatusCode: 400,
          requestId: '762ed35b-3a0d-498a-abff-b5f426d1a535',
          extendedRequestId: undefined,
          cfId: 'bQ_UWvl59Zq05XINyBMKEuBdwZxdH4N2gy7WWbv72ai8ve9FULEzfw==',
          attempts: 1,
          totalRetryDelay: 0
        }
      });

      mockDynamoDbClient.on(GetItemCommand).resolves({ Item: undefined });
      mockIvsClient.on(PutMetadataCommand).rejects(validationExceptionResponse);

      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams,
        payload: defaultValidPayload
      });
      const { __type } = JSON.parse(response.payload);

      expect(mockConsoleError).toHaveBeenCalledWith(
        validationExceptionResponse
      );
      expect(response.statusCode).toBe(400);
      expect(__type).toBe(TIMED_METADATA_VALIDATION_EXCEPTION);
    });
  });

  describe('general cases', () => {
    it('should successfully send a timed metadata event', async () => {
      mockIvsClient.on(PutMetadataCommand).callsFake(({ channelArn }) => {
        if (channelArn === defaultUserData.channelArn) return;

        throw new Error('Wrong channelArn value');
      });

      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams,
        payload: defaultValidPayload
      });

      expect(mockConsoleError).toHaveBeenCalledTimes(0);
      expect(response.statusCode).toBe(200);
    });

    it('should retry sending a timed metadata event when receiving a throttling exception and succeed', async () => {
      mockIvsClient
        .on(PutMetadataCommand)
        .rejectsOnce(throttlingExceptionResponse)
        .callsFake(({ channelArn }) => {
          if (channelArn === defaultUserData.channelArn) return;

          throw new Error('Wrong channelArn value');
        });

      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams,
        payload: defaultValidPayload
      });

      expect(mockConsoleError).toHaveBeenCalledTimes(0);
      expect(response.statusCode).toBe(200);
    });
  });
});
