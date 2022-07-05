import { AdminUpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';
import { FastifyReply, FastifyRequest } from 'fastify';

import { CHANGE_USERNAME_EXCEPTION } from '../../utils/constants';
import { cognitoClient, updateDynamoUserAttributes } from '../helpers';
import { ResponseBody, isCognitoError } from '../../utils';
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
    await updateDynamoUserAttributes(sub, [
      { key: 'username', value: newUsername }
    ]);
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
