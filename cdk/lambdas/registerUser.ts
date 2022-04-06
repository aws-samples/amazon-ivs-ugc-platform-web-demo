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

import {
  CHANNEL_CREATION_ERROR,
  INVALID_INPUT_ERROR,
  USER_CREATION_ERROR
} from './constants';
import { createFailureResponse, createSuccessResponse } from './utils';

const cognitoClient = new CognitoIdentityProviderClient({});
const ivsClient = new IvsClient({});
const dynamoDbClient = new DynamoDBClient({});

export const handler: APIGatewayProxyHandler = async (event) => {
  const { email, password, username } = JSON.parse(event?.body || '');

  if (!email || !password || !username) {
    console.error(
      `Invalid input:\nemail: ${email}\npassword: ${password}\nusername: ${username}\n`
    );

    return createFailureResponse({
      message: INVALID_INPUT_ERROR,
      statusCode: 400
    });
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

    return createFailureResponse({ message: USER_CREATION_ERROR });
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

    return createFailureResponse({ message: CHANNEL_CREATION_ERROR });
  }

  // Create entry in the user table
  const putItemCommand = new PutItemCommand({
    Item: {
      channelArn: { S: channelArn },
      channelName: { S: channelName },
      email: { S: email },
      id: { S: userSub },
      username: { S: username }
    },
    TableName: process.env.USER_TABLE_NAME
  });

  try {
    await dynamoDbClient.send(putItemCommand);
  } catch (error) {
    console.error(error);

    return createFailureResponse({ message: USER_CREATION_ERROR });
  }

  return createSuccessResponse({ statusCode: 201 });
};
