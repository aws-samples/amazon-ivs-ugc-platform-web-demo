import { APIGatewayProxyHandler } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  SignUpCommand
} from '@aws-sdk/client-cognito-identity-provider';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.CDK_DEFAULT_REGION
});

const FAILURE = 'FAILURE';
const SUCCESS = 'SUCCESS';

export const handler: APIGatewayProxyHandler = async (event) => {
  const { email, password, username } = JSON.parse(event?.body || '');

  if (!email || !password || !username) {
    return {
      body: JSON.stringify({ message: FAILURE }),
      statusCode: 500
    };
  }

  const signUpCommand = new SignUpCommand({
    ClientId: process.env.USER_POOL_CLIENT_ID as string,
    Username: username,
    Password: password,
    UserAttributes: [{ Name: 'email', Value: email }]
  });

  let responseBody = { message: SUCCESS };
  let statusCode = 200;

  try {
    await cognitoClient.send(signUpCommand);
  } catch (error) {
    responseBody.message = FAILURE;
    statusCode = 500;
  }

  return {
    body: JSON.stringify(responseBody),
    statusCode
  };
};
