import {
  AdminUpdateUserAttributesCommand,
  CognitoIdentityProviderClient
} from '@aws-sdk/client-cognito-identity-provider';
import { FastifyReply, FastifyRequest } from 'fastify';

import { CHANGE_USERNAME_EXCEPTION } from '../../utils/constants';
import { ResponseBody } from '../../utils';
import { updateDynamoUserAttributes } from '../../utils/userManagementHelpers';
import { UserContext } from './authorizer';

const cognitoClient = new CognitoIdentityProviderClient({});

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

    return reply.send({ __type: CHANGE_USERNAME_EXCEPTION });
  }
  const responseBody: ChangeUsernameResponseBody = { username: newUsername };

  return reply.send(responseBody);
};

export default handler;
