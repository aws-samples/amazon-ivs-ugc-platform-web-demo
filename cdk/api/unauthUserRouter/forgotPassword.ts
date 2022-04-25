import {
  CognitoIdentityProviderClient,
  ForgotPasswordCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { FastifyReply, FastifyRequest } from 'fastify';

import { FORGOT_PASSWORD_EXCEPTION } from '../utils/constants';
import { getUserByEmail } from '../utils/userManagementHelpers';
import { isCognitoError } from '../utils';

const cognitoClient = new CognitoIdentityProviderClient({});

type ForgotPasswordRequestBody = { email: string | undefined };

const handler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { email }: ForgotPasswordRequestBody =
    request.body as ForgotPasswordRequestBody;

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

      if (isCognitoError(error)) {
        reply.statusCode = 500;

        return reply.send({
          __type: FORGOT_PASSWORD_EXCEPTION,
          message: error.message
        });
      }
    }
  }

  // This endpoint always returns 200 for security purposes
  return reply.send({});
};

export default handler;
