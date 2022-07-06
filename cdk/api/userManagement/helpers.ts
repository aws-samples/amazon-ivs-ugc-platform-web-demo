import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  QueryCommand
} from '@aws-sdk/client-dynamodb';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { IvsClient } from '@aws-sdk/client-ivs';

export const dynamoDbClient = new DynamoDBClient({});
export const cognitoClient = new CognitoIdentityProviderClient({});
export const ivsClient = new IvsClient({});

export const getUser = (sub: string) => {
  const getItemCommand = new GetItemCommand({
    Key: { id: { S: sub } },
    TableName: process.env.USER_TABLE_NAME
  });

  return dynamoDbClient.send(getItemCommand);
};
export const getUserByEmail = (userEmail: string) => {
  const queryCommand = new QueryCommand({
    IndexName: 'emailIndex',
    TableName: process.env.USER_TABLE_NAME,
    Limit: 1,
    KeyConditionExpression: 'email = :userEmail',
    ExpressionAttributeValues: { ':userEmail': { S: userEmail } }
  });

  return dynamoDbClient.send(queryCommand);
};
export const deleteUser = (sub: string) => {
  const deleteItemCommand = new DeleteItemCommand({
    Key: { id: { S: sub } },
    TableName: process.env.USER_TABLE_NAME
  });

  return dynamoDbClient.send(deleteItemCommand);
};

export const getChannelArnParams = (
  channelArn: string
): { accountId?: string; region?: string; resourceId?: string } => {
  const groups = channelArn.match(
    /^arn:aws:ivs:(?<region>[a-z0-9-]+):(?<accountId>\d+):channel\/(?<resourceId>.+)/
  )?.groups;

  if (groups) {
    return groups;
  }

  return {};
};
