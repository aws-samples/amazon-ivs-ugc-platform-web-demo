import {
  AdminDeleteUserCommand,
  AdminDisableUserCommand,
  CognitoIdentityProviderClient
} from '@aws-sdk/client-cognito-identity-provider';
import { APIGatewayProxyWithCognitoAuthorizerHandler } from 'aws-lambda';
import {
  ChannelNotBroadcasting,
  DeleteChannelCommand,
  IvsClient,
  StopStreamCommand
} from '@aws-sdk/client-ivs';

import { createResponse, deleteUser, getUser } from './utils';

const ivsClient = new IvsClient({});
const cognitoClient = new CognitoIdentityProviderClient({});

export const handler: APIGatewayProxyWithCognitoAuthorizerHandler = async (
  event
) => {
  const {
    requestContext: { authorizer: authorizerContext }
  } = event;
  const {
    claims: { ['cognito:username']: username, sub }
  } = authorizerContext;

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
