import {
  CognitoIdentityProviderClient,
  ForgotPasswordCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { APIGatewayProxyHandler } from 'aws-lambda';

import { createResponse } from './utils';
import { getUserByEmail } from './utils/userManagementHelpers';

const cognitoClient = new CognitoIdentityProviderClient({});

export const handler: APIGatewayProxyHandler = async (event) => {
  const { email } = JSON.parse(event.body || '');

  if (email) {
    try {
      const { Items } = await getUserByEmail(email);

      if (Items && Items.length > 0) {
        const {
          username: { S: Username }
        } = Items[0];

        const forgotPasswordCommand = new ForgotPasswordCommand({
          ClientId: process.env.USER_POOL_CLIENT_ID,
          Username
        });

        await cognitoClient.send(forgotPasswordCommand);
      }
    } catch (error) {
      console.error(error);
    }
  }

  // This endpoint always returns 200 for security purposes
  return createResponse(200);
};
