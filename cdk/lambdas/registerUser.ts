import {
  CognitoIdentityProviderClient,
  SignUpCommand
} from '@aws-sdk/client-cognito-identity-provider';
import {
  ChannelType,
  CreateChannelCommand,
  IvsClient
} from '@aws-sdk/client-ivs';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

import { createFailureResponse, createSuccessResponse } from './utils';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.CDK_DEFAULT_REGION
});
const ivsClient = new IvsClient({ region: process.env.CDK_DEFAULT_REGION });
const dynamoDbClient = new DynamoDBClient({
  region: process.env.CDK_DEFAULT_REGION
});

export const handler: APIGatewayProxyHandler = async (event) => {
  const { email, password, username } = JSON.parse(event?.body || '');

  if (!email || !password || !username) {
    console.error(
      `Invalid input:\nemail: ${email}\npassword: ${password}\nusername: ${username}\n`
    );

    return createFailureResponse(400);
  }

  // Create Cognito user
  const signUpCommand = new SignUpCommand({
    ClientId: process.env.USER_POOL_CLIENT_ID as string,
    Username: username,
    Password: password,
    UserAttributes: [{ Name: 'email', Value: email }]
  });
  let userSub;

  try {
    const { UserSub } = await cognitoClient.send(signUpCommand);
    userSub = UserSub;

    if (!userSub) {
      throw new Error(`Empty UserSub for user: ${username}`);
    }
  } catch (error) {
    console.error(error);

    return createFailureResponse();
  }

  // Create IVS channel
  const cleanedUsername = username.replace(/[^a-zA-Z0-9-_]/g, '');
  const channelName = `${cleanedUsername}s-channel`;
  const createChannelCommand = new CreateChannelCommand({
    name: channelName,
    type: process.env.IVS_CHANNEL_TYPE as ChannelType
  });
  let channelArn;

  try {
    const { channel = {} } = await ivsClient.send(createChannelCommand);
    channelArn = channel.arn;

    if (!channelArn) {
      throw new Error(`Empty ARN for channel: ${channelName}`);
    }
  } catch (error) {
    console.error(error);

    return createFailureResponse();
  }

  // Create entry in the user table
  const putItemCommand = new PutItemCommand({
    TableName: process.env.USER_TABLE_NAME,
    Item: {
      id: { S: userSub },
      username: { S: username },
      channelName: { S: channelName },
      channelArn: { S: channelArn }
    }
  });

  try {
    await dynamoDbClient.send(putItemCommand);
  } catch (error) {
    console.error(error);

    return createFailureResponse();
  }

  return createSuccessResponse(201);
};
