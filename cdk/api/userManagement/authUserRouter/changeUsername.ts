import { AdminUpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';
import { FastifyReply, FastifyRequest } from 'fastify';

import { CHANGE_USERNAME_EXCEPTION } from '../../shared/constants';
import { cognitoClient, dynamoDbClient } from '../helpers';
import { ResponseBody, isCognitoError } from '../../shared';
import { updateDynamoItemAttributes } from '../../shared/helpers';
import { UserContext } from '../authorizer';

type ChangeUsernameRequestBody = { newUsername: string | undefined };

interface ChangeUsernameResponseBody extends ResponseBody {
  username: string;
}
const handler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { sub, username } = request.requestContext.get('user') as UserContext;
  const { newUsername } = request.body as ChangeUsernameRequestBody;

  try {
    if (!newUsername) {
      throw new Error(`Missing newUsername for user: ${username}`);
    }

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
      dynamoDbClient,
      id: sub,
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
