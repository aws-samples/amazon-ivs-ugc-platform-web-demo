import { FastifyReply, FastifyRequest } from 'fastify';
import { marshall } from '@aws-sdk/util-dynamodb';
import { PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SignUpCommand } from '@aws-sdk/client-cognito-identity-provider';

import {
  ACCOUNT_REGISTRATION_EXCEPTION,
  RESTRICTED_USERNAMES,
  EMAIL_EXISTS_EXCEPTION,
  RESERVED_USERNAME_EXCEPTION,
  MAX_USERNAME_CHARACTER_COUNT,
  MIN_USERNAME_CHARACTER_COUNT,
  UNEXPECTED_EXCEPTION
} from '../../shared/constants';
import {
  cognitoClient,
  dynamoDbClient,
  isCognitoError
} from '../../shared/helpers';
import { getUserByEmail } from '../helpers';

type SignUpRequestBody = {
  avatar: string;
  color: string;
  email: string;
  password: string;
  username: string;
};

const { SIGN_UP_ALLOWED_DOMAINS: signUpAllowedDomainsStr = '[]' } = process.env;
const signUpAllowedDomains: string[] = JSON.parse(signUpAllowedDomainsStr);

const handler = async (
  request: FastifyRequest<{ Body: SignUpRequestBody }>,
  reply: FastifyReply
) => {
  const { avatar, color, email, password, username } = request.body;

  // Check input
  if (!avatar || !color || !email || !password || !username) {
    console.error(
      `Incorrect input:\n- avatar:${avatar}\n- color:${color}\n- email:${email}\n- password:${password}\n- username:${username}`
    );

    reply.statusCode = 400;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  // Check for allowed email domains
  if (
    // If signUpAllowedDomains is empty, allow any email domain
    signUpAllowedDomains.length &&
    !signUpAllowedDomains.some(
      (signUpAllowedDomain) => email.split('@')[1] === signUpAllowedDomain
    )
  ) {
    console.error(
      `Provided email "${email}" does not match any of the allowed domains:\n${signUpAllowedDomains.join(
        '\n'
      )}`
    );

    reply.statusCode = 400;

    return reply.send({ __type: ACCOUNT_REGISTRATION_EXCEPTION });
  }

  // Check for restricted usernames
  if (RESTRICTED_USERNAMES.includes(username)) {
    console.error(`Attempt to register a reserved username: ${username}`);

    reply.statusCode = 400;

    return reply.send({ __type: RESERVED_USERNAME_EXCEPTION });
  }

  // Check minimum and maximum allowed characters for username
  if (
    username.length < MIN_USERNAME_CHARACTER_COUNT ||
    username.length > MAX_USERNAME_CHARACTER_COUNT
  ) {
    console.error(
      `${username} character length must be at least ${MIN_USERNAME_CHARACTER_COUNT} and a maximum of ${MAX_USERNAME_CHARACTER_COUNT}`
    );

    reply.statusCode = 400;

    return reply.send({ __type: ACCOUNT_REGISTRATION_EXCEPTION });
  }

  let userConfirmed;

  try {
    const { Items } = await getUserByEmail(email);

    // Check for email uniqueness
    if (Items && Items.length > 0) {
      console.error(`Email already taken: ${email}`);

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
        Item: marshall({
          avatar,
          color,
          email,
          id: UserSub,
          username
        }),
        TableName: process.env.USER_TABLE_NAME
      });

      await dynamoDbClient.send(putItemCommand);
    } else {
      throw new Error(`Missing sub for user account: ${username}`);
    }
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    return reply.send(
      isCognitoError(error)
        ? { __type: error.name, message: error.message }
        : { __type: ACCOUNT_REGISTRATION_EXCEPTION }
    );
  }

  reply.statusCode = 201;

  return reply.send({ userConfirmed });
};

export default handler;
