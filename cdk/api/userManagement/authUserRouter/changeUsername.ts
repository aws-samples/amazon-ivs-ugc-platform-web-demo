import { AdminUpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';
import { FastifyReply, FastifyRequest } from 'fastify';

import {
  RESTRICTED_USERNAMES,
  CHANGE_USERNAME_EXCEPTION,
  RESERVED_USERNAME_EXCEPTION,
  UNEXPECTED_EXCEPTION,
  MIN_USERNAME_CHARACTER_COUNT,
  MAX_USERNAME_CHARACTER_COUNT
} from '../../shared/constants';
import {
  cognitoClient,
  isCognitoError,
  ResponseBody,
  updateDynamoItemAttributes
} from '../../shared/helpers';
import { UserContext } from '../authorizer';

type ChangeUsernameRequestBody = { newUsername: string | undefined };

interface ChangeUsernameResponseBody extends ResponseBody {
  username: string;
}

const handler = async (
  request: FastifyRequest<{ Body: ChangeUsernameRequestBody }>,
  reply: FastifyReply
) => {
  const { sub, username } = request.requestContext.get('user') as UserContext;
  const { newUsername } = request.body;

  // Check input
  if (!newUsername) {
    console.error(`Missing newUsername for user: ${username}`);

    reply.statusCode = 400;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  // Check for banned usernames
  if (RESTRICTED_USERNAMES.includes(newUsername)) {
    console.error(`Attempt to register a reserved username: ${newUsername}`);

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

    return reply.send({ __type: CHANGE_USERNAME_EXCEPTION });
  }

  try {
    const updateUserAttributesCommand = new AdminUpdateUserAttributesCommand({
      UserAttributes: [{ Name: 'preferred_username', Value: newUsername }],
      Username: username,
      UserPoolId: process.env.USER_POOL_ID
    });

    // Update preferred_username in Cognito
    await cognitoClient.send(updateUserAttributesCommand);

    // Update Dynamo user entry
    await updateDynamoItemAttributes({
      attributes: [{ key: 'username', value: newUsername }],
      primaryKey: { key: 'id', value: sub },
      tableName: process.env.USER_TABLE_NAME as string
    });
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    if (isCognitoError(error)) {
      return reply.send({ __type: error.name });
    }

    return reply.send({ __type: CHANGE_USERNAME_EXCEPTION });
  }

  const responseBody: ChangeUsernameResponseBody = { username: newUsername };

  return reply.send(responseBody);
};

export default handler;
