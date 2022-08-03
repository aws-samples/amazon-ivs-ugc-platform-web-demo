import { mockClient } from 'aws-sdk-client-mock';
import { UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { AdminUpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';

import {
  CHANGE_USERNAME_EXCEPTION,
  RESERVED_USERNAME_EXCEPTION,
  UNEXPECTED_EXCEPTION
} from '../../../shared/constants';
import { cognitoClient, dynamoDbClient } from '../../../shared/helpers';
import { injectAuthorizedRequest } from '../../../testUtils';
import buildServer from '../../../buildServer';

const mockDynamoDbClient = mockClient(dynamoDbClient);
const mockCognitoClient = mockClient(cognitoClient);
const route = '/user/username/update';
const defaultRequestParams = { method: 'PUT' as const, url: route };

const defaultValidPayload = {
  newUsername: 'newUsername'
};

describe('changeUsername controller', () => {
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
    mockCognitoClient.reset();
    mockCognitoClient.on(AdminUpdateUserAttributesCommand).resolves({});

    mockDynamoDbClient.reset();
    mockDynamoDbClient.on(UpdateItemCommand).resolves({});
  });

  describe('error handling', () => {
    it('should return an unexpected exception when the input is incomplete', async () => {
      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams,
        payload: {}
      });

      const { __type } = JSON.parse(response.payload);

      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(400);
      expect(__type).toBe(UNEXPECTED_EXCEPTION);
    });

    it('should return a reserved username exception when the new username is banned', async () => {
      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams,
        payload: { ...defaultValidPayload, newUsername: 'settings' }
      });
      const { __type } = JSON.parse(response.payload);

      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(400);
      expect(__type).toBe(RESERVED_USERNAME_EXCEPTION);
    });

    it('should return a change username exception when the Cognito client fails', async () => {
      mockCognitoClient.on(AdminUpdateUserAttributesCommand).rejects({});

      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams,
        payload: defaultValidPayload
      });
      const { __type } = JSON.parse(response.payload);

      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(500);
      expect(__type).toBe(CHANGE_USERNAME_EXCEPTION);
    });

    it('should return a Cognito exception when the Cognito client throws an error', async () => {
      mockCognitoClient.on(AdminUpdateUserAttributesCommand).rejects({
        message: 'This is an error from Cognito',
        name: 'CognitoError'
      });

      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams,
        payload: defaultValidPayload
      });
      const { __type } = JSON.parse(response.payload);

      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(500);
      expect(__type).toBe('CognitoError');
    });

    it('should return a change username exception when the DynamoDB client fails', async () => {
      mockDynamoDbClient.on(UpdateItemCommand).rejects({});

      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams,
        payload: defaultValidPayload
      });
      const { __type } = JSON.parse(response.payload);

      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(500);
      expect(__type).toBe(CHANGE_USERNAME_EXCEPTION);
    });
  });

  describe('general cases', () => {
    it('should have successfully updated the username', async () => {
      // Make sure AdminUpdateUserAttributesCommand is called with the correct params
      mockCognitoClient
        .on(AdminUpdateUserAttributesCommand)
        .callsFake(({ UserAttributes }) => {
          if (UserAttributes[0].Value === defaultValidPayload.newUsername) {
            return;
          }

          throw new Error('Wrong value');
        });

      // Make sure UpdateItemCommand is called with the correct new username value
      mockDynamoDbClient
        .on(UpdateItemCommand)
        .callsFake(({ AttributeUpdates }) => {
          if (
            AttributeUpdates.username.Value.S ===
            defaultValidPayload.newUsername
          ) {
            return;
          }

          throw new Error('Wrong value');
        });
      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams,
        payload: defaultValidPayload
      });
      const { username } = JSON.parse(response.payload);

      expect(mockConsoleError).toHaveBeenCalledTimes(0);
      expect(response.statusCode).toBe(200);
      expect(username).toBe(defaultValidPayload.newUsername);
    });
  });
});
