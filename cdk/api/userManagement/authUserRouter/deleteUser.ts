import {
  AdminDeleteUserCommand,
  AdminDisableUserCommand
} from '@aws-sdk/client-cognito-identity-provider';
import {
  ChannelNotBroadcasting,
  DeleteChannelCommand,
  StopStreamCommand
} from '@aws-sdk/client-ivs';
import { FastifyReply, FastifyRequest } from 'fastify';

import { ACCOUNT_DELETION_EXCEPTION } from '../../shared/constants';
import { cognitoClient, deleteUser, getUser, ivsClient } from '../helpers';
import { UserContext } from '../authorizer';

const handler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { sub, username } = request.requestContext.get('user') as UserContext;

  try {
    // Get user from userTable
    const { Item = {} } = await getUser(sub);
    const {
      channelArn: { S: channelArn }
    } = Item;

    if (channelArn) {
      // First stop the stream if it's running
      const stopStreamCommand = new StopStreamCommand({ channelArn });

      try {
        await ivsClient.send(stopStreamCommand);
      } catch (error) {
        // Error out silently if the channel is not currently live
        if (!(error instanceof ChannelNotBroadcasting)) {
          throw error;
        }
      }

      // Delete the IVS channel
      const deleteChannelCommand = new DeleteChannelCommand({
        arn: channelArn
      });

      await ivsClient.send(deleteChannelCommand);
    }

    // Delete the Dynamo user entry
    await deleteUser(sub);

    // Disable Cognito user
    const disableUserCommand = new AdminDisableUserCommand({
      Username: username,
      UserPoolId: process.env.USER_POOL_ID
    });

    await cognitoClient.send(disableUserCommand);

    // Delete Cognito user
    const deleteUserCommand = new AdminDeleteUserCommand({
      Username: username,
      UserPoolId: process.env.USER_POOL_ID
    });

    await cognitoClient.send(deleteUserCommand);
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    return reply.send({ __type: ACCOUNT_DELETION_EXCEPTION });
  }

  return reply.send({});
};

export default handler;
