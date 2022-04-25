import {
  AttributeValueUpdate,
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

export const updateDynamoUserAttributes = (
  sub: string,
  attributes = [] as { key: string; value: string }[]
) => {
  if (!attributes.length) return;

  const attributesToUpdate = attributes.reduce(
    (acc, { key, value }) => ({
      ...acc,
      [key]: { Action: 'PUT', Value: { S: value } }
    }),
    {}
  ) as { [key: string]: AttributeValueUpdate };

  const putItemCommand = new UpdateItemCommand({
    AttributeUpdates: attributesToUpdate,
    Key: { id: { S: sub } },
    TableName: process.env.USER_TABLE_NAME
  });

  return dynamoDbClient.send(putItemCommand);
};
