import { FastifyReply, FastifyRequest } from 'fastify';
import { ForgotPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';

import { getUserByEmail } from '../helpers';
import { FORGOT_PASSWORD_EXCEPTION } from '../../shared/constants';
import { isCognitoError, cognitoClient } from '../../shared/helpers';

type ForgotPasswordRequestBody = { email: string | undefined };

const handler = async (
  request: FastifyRequest<{ Body: ForgotPasswordRequestBody }>,
  reply: FastifyReply
) => {
  const { email }: ForgotPasswordRequestBody = request.body;

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
