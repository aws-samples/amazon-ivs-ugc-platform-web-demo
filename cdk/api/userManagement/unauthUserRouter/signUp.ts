import { FastifyReply, FastifyRequest } from 'fastify';
import { marshall } from '@aws-sdk/util-dynamodb';
import { PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SignUpCommand } from '@aws-sdk/client-cognito-identity-provider';

import {
  ACCOUNT_REGISTRATION_EXCEPTION,
  EMAIL_EXISTS_EXCEPTION,
  UNEXPECTED_EXCEPTION
} from '../../shared/constants';
import { cognitoClient, dynamoDbClient, getUserByEmail } from '../helpers';
import { isCognitoError } from '../../shared';

type SignUpRequestBody = {
  email: string | undefined;
  password: string | undefined;
  username: string | undefined;
};

const handler = async (
  request: FastifyRequest<{ Body: SignUpRequestBody }>,
  reply: FastifyReply
) => {
  const { email, password, username }: SignUpRequestBody = request.body;

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
    const { UserConfirmed, UserSub } = await cognitoClient.send(signUpCommand);

    userConfirmed = UserConfirmed;

    if (UserSub) {
      // Create entry in the user table
      const putItemCommand = new PutItemCommand({
        Item: marshall({ email, id: UserSub, username }),
        TableName: process.env.USER_TABLE_NAME
      });

      await dynamoDbClient.send(putItemCommand);
    } else {
      throw new Error(`Missing sub for user account: ${username}`);
    }
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    return reply.send({
      ...(isCognitoError(error)
        ? { __type: error.name, message: error.message }
        : { __type: ACCOUNT_REGISTRATION_EXCEPTION })
    });
  }

  reply.statusCode = 201;

  return reply.send({ userConfirmed });
};

export default handler;
