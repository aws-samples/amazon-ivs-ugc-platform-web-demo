import { marshall } from '@aws-sdk/util-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { SignUpCommand } from '@aws-sdk/client-cognito-identity-provider';

import {
  ACCOUNT_REGISTRATION_EXCEPTION,
  EMAIL_EXISTS_EXCEPTION,
  RESERVED_USERNAME_EXCEPTION,
  UNEXPECTED_EXCEPTION
} from '../../../shared/constants';
import { cognitoClient, dynamoDbClient } from '../../../shared/helpers';
import buildServer from '../../../buildServer';

const mockDynamoDbClient = mockClient(dynamoDbClient);
const mockCognitoClient = mockClient(cognitoClient);
const route = '/user/register';
const defaultRequestParams = { method: 'POST' as const, url: route };

const defaultValidPayload = {
  avatar: 'avatar',
  color: 'blue',
  email: 'john@doe.com',
  password: 'Passw0rd/',
  username: 'jdoe'
};
const defaultSignupOutput = { UserConfirmed: true, UserSub: 'user-sub' };

describe('signUp controller', () => {
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
    mockDynamoDbClient.on(QueryCommand).resolves({ Items: [] });

    mockCognitoClient.reset();
    mockCognitoClient.on(SignUpCommand).resolves(defaultSignupOutput);
  });

  describe('error handling', () => {
    it('should return an unexpected exception when the input is incomplete', async () => {
      const response = await server.inject({
        ...defaultRequestParams,
        payload: { ...defaultValidPayload, username: undefined }
      });
      const { __type } = JSON.parse(response.payload);

      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(400);
      expect(__type).toBe(UNEXPECTED_EXCEPTION);
    });

    it('should return a reserved username exception when the username is banned', async () => {
      const response = await server.inject({
        ...defaultRequestParams,
        payload: { ...defaultValidPayload, username: 'settings' }
      });
      const { __type } = JSON.parse(response.payload);

      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(400);
      expect(__type).toBe(RESERVED_USERNAME_EXCEPTION);
    });

    it('should return a account register exception when the username is less than four characters', async () => {
      const response = await server.inject({
        ...defaultRequestParams,
        payload: { ...defaultValidPayload, username: 'joe' }
      });
      const { __type } = JSON.parse(response.payload);

      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(400);
      expect(__type).toBe(ACCOUNT_REGISTRATION_EXCEPTION);
    });

    it('should return a account register exception when the username is more than twenty characters', async () => {
      const response = await server.inject({
        ...defaultRequestParams,
        payload: { ...defaultValidPayload, username: 'alexanderhamilton1234' }
      });
      const { __type } = JSON.parse(response.payload);

      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(400);
      expect(__type).toBe(ACCOUNT_REGISTRATION_EXCEPTION);
    });

    it('should return an account registration exception when the DynamoDB client fails', async () => {
      mockDynamoDbClient.on(QueryCommand).rejects({});

      const response = await server.inject({
        ...defaultRequestParams,
        payload: defaultValidPayload
      });
      const { __type } = JSON.parse(response.payload);

      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(500);
      expect(__type).toBe(ACCOUNT_REGISTRATION_EXCEPTION);
    });

    it('should return an email exists exception when the email is taken', async () => {
      mockDynamoDbClient
        .on(QueryCommand)
        .callsFake(({ ExpressionAttributeValues }) => {
          if (
            ExpressionAttributeValues[':userEmail'].S ===
            defaultValidPayload.email
          ) {
            return { Items: [{ email: defaultValidPayload.email }] };
          }

          throw new Error('Wrong input');
        });

      const response = await server.inject({
        ...defaultRequestParams,
        payload: defaultValidPayload
      });
      const { __type } = JSON.parse(response.payload);

      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(400);
      expect(__type).toBe(EMAIL_EXISTS_EXCEPTION);
    });

    it('should return a Cognito exception when the Cognito client throws an error', async () => {
      mockCognitoClient.on(SignUpCommand).rejects({
        message: 'This is an error from Cognito',
        name: 'CognitoError'
      });

      const response = await server.inject({
        ...defaultRequestParams,
        payload: defaultValidPayload
      });
      const { __type } = JSON.parse(response.payload);

      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(500);
      expect(__type).toBe('CognitoError');
    });

    it('should return an account registration exception when the UserSub is missing', async () => {
      mockCognitoClient.on(SignUpCommand).resolves({ UserConfirmed: false });

      const response = await server.inject({
        ...defaultRequestParams,
        payload: defaultValidPayload
      });
      const { __type, message } = JSON.parse(response.payload);

      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(500);
      expect(__type).toBe('Error');
      expect(message).toBe('Missing sub for user account: jdoe');
    });
  });

  describe('general cases', () => {
    it('should have successfully created a new user', async () => {
      // Make sure SignUpCommand is called with the correct params
      mockCognitoClient.on(SignUpCommand).callsFake(({ UserAttributes }) => {
        if (UserAttributes[0].Value === defaultValidPayload.email) {
          return defaultSignupOutput;
        }

        throw new Error('Wrong value');
      });

      // Make sure PutItemCommand is called with the correct item
      mockDynamoDbClient.on(PutItemCommand).callsFake(({ Item }) => {
        if (
          JSON.stringify(Item) ===
          JSON.stringify(
            marshall({
              avatar: defaultValidPayload.avatar,
              color: defaultValidPayload.color,
              email: defaultValidPayload.email,
              id: 'user-sub',
              username: defaultValidPayload.username
            })
          )
        ) {
          return;
        }

        throw new Error('Wrong value');
      });
      const response = await server.inject({
        ...defaultRequestParams,
        payload: defaultValidPayload
      });
      const { userConfirmed } = JSON.parse(response.payload);

      expect(mockConsoleError).toHaveBeenCalledTimes(0);
      expect(response.statusCode).toBe(201);
      expect(userConfirmed).toBe(true);
    });
  });
});
