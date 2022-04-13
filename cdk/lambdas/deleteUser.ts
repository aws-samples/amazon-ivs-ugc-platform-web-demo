import {
  AdminDeleteUserCommand,
  AdminDisableUserCommand,
  CognitoIdentityProviderClient
} from '@aws-sdk/client-cognito-identity-provider';
import {
  ChannelNotBroadcasting,
  DeleteChannelCommand,
  IvsClient,
  StopStreamCommand
} from '@aws-sdk/client-ivs';
import { APIGatewayProxyWithLambdaAuthorizerHandler } from 'aws-lambda';

import { createResponse, deleteUser, getUser } from './utils';
import { UserContext } from './authorizer';

const ivsClient = new IvsClient({});
const cognitoClient = new CognitoIdentityProviderClient({});

export const handler: APIGatewayProxyWithLambdaAuthorizerHandler<
  UserContext
> = async (event) => {
  const {
    requestContext: {
      authorizer: { sub, username }
    }
  } = event;

  try {
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

    // Get user from userTable
    const { Item = {} } = await getUser(sub);
    const {
      channelArn: { S: channelArn }
    } = Item;

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

    // Delete the Dynamo user entry
    await deleteUser(sub);
  } catch (error) {
    console.error(error);

    return createResponse(500);
  }

  return createResponse(200);
};
