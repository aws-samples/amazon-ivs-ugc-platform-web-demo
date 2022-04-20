import {
  CognitoIdentityProviderClient,
  SignUpCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { FastifyReply, FastifyRequest } from 'fastify';

import {
  ACCOUNT_REGISTRATION_EXCEPTION,
  EMAIL_EXISTS_EXCEPTION,
  UNEXPECTED_EXCEPTION
} from '../utils/constants';
import { getUserByEmail } from '../utils/userManagementHelpers';
import { isCognitoError } from '../utils';

const cognitoClient = new CognitoIdentityProviderClient({});

type SignUpRequestBody = {
  email: string | undefined;
  password: string | undefined;
  username: string | undefined;
};

const handler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { email, password, username }: SignUpRequestBody = JSON.parse(
    request.body as string
  );

  // Check input
  if (!email || !password || !username) {
    reply.statusCode = 400;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  let userConfirmed;

  try {
    const { Items } = await getUserByEmail(email);

    // Check for email uniqueness
    if (Items && Items.length > 0) {
      reply.statusCode = 400;

      return reply.send({ __type: EMAIL_EXISTS_EXCEPTION });
    }

    const signUpCommand = new SignUpCommand({
      ClientId: process.env.USER_POOL_CLIENT_ID,
      Username: username,
      Password: password,
      UserAttributes: [{ Name: 'email', Value: email }]
    });

    // Create Cognito user
    const { UserConfirmed } = await cognitoClient.send(signUpCommand);

    userConfirmed = UserConfirmed;
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    return reply.send({
      __type: ACCOUNT_REGISTRATION_EXCEPTION,
      ...(isCognitoError(error) ? { message: error.message } : {})
    });
  }

  reply.statusCode = 201;

  return reply.send({ userConfirmed });
};

export default handler;
