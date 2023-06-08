import { mockClient } from 'aws-sdk-client-mock';
import { UpdateItemCommand } from '@aws-sdk/client-dynamodb';

import { CHANGE_USER_PREFERENCES_EXCEPTION } from '../../../shared/constants';
import { dynamoDbClient } from '../../../shared/helpers';
import { injectAuthorizedRequest } from '../../../testUtils';
import buildServer from '../../../buildServer';

const mockDynamoDbClient = mockClient(dynamoDbClient);

const url = '/channel/preferences/update';
const defaultRequestParams = { method: 'PUT' as const, url };

describe('changeUserPreferences controller', () => {
  const server = buildServer();
  const mockConsoleError = jest.fn();

  beforeAll(() => {
    console.error = mockConsoleError;
  });

  beforeEach(() => {
    mockDynamoDbClient.reset();
    mockDynamoDbClient.on(UpdateItemCommand).resolves({});
  });

  describe('error handling', () => {
    it('should return an error if req.body is an empty object', async () => {
      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams,
        payload: {}
      });

      const { statusCode, message } = JSON.parse(response.payload);

      expect(message).toBe('Missing new user preferences for user: username');
      expect(statusCode).toBe(500);
    });

    it('should throw previewUrl key missing error if previewUrl is missing from req.body', async () => {
      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams,
        payload: {
          banner: {
            uploadDateTime: 'Thu, 02 Feb 2023 21:02:58 GMT'
          }
        }
      });

      const { payload, statusCode } = response;
      const { __type } = JSON.parse(payload);

      expect(__type).toBe(CHANGE_USER_PREFERENCES_EXCEPTION);
      expect(statusCode).toBe(500);
    });

    it('should throw uploadDateTime key missing error if previewUrl is missing from req.body', async () => {
      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams,
        payload: {
          banner: {
            previewUrl: 'previewUrl'
          }
        }
      });

      const { payload, statusCode } = response;
      const { __type } = JSON.parse(payload);

      expect(__type).toBe(CHANGE_USER_PREFERENCES_EXCEPTION);
      expect(statusCode).toBe(500);
    });
  });

  describe('general cases', () => {
    it('should process the request correctly', async () => {
      const reqBody = {
        banner: {
          previewUrl: 'previewUrl',
          uploadDateTime: 'Thu, 02 Feb 2023 21:02:58 GMT'
        }
      };
      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams,
        payload: reqBody
      });

      const { payload } = response;
      const res = JSON.parse(payload);

      expect(mockConsoleError).not.toHaveBeenCalled();
      expect(res).toEqual(reqBody);
    });
  });
});
