import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  QueryCommand,
  UpdateItemCommand
} from '@aws-sdk/client-dynamodb';

const dynamoDbClient = new DynamoDBClient({});

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

export const updateUserStreamKey = (
  sub: string,
  newStreamKeyArn: string,
  newStreamKeyValue: string
) => {
  const putItemCommand = new UpdateItemCommand({
    AttributeUpdates: {
      streamKeyArn: { Action: 'PUT', Value: { S: newStreamKeyArn } },
      streamKeyValue: { Action: 'PUT', Value: { S: newStreamKeyValue } }
    },
    Key: { id: { S: sub } },
    TableName: process.env.USER_TABLE_NAME
  });

  return dynamoDbClient.send(putItemCommand);
};
