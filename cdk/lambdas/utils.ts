import { APIGatewayProxyWithCognitoAuthorizerEvent } from 'aws-lambda';
import {
  DynamoDBClient,
  GetItemCommand,
  UpdateItemCommand
} from '@aws-sdk/client-dynamodb';

export interface ResponseBody {
  [key: string]: string | undefined;
}

export const createResponse = (
  statusCode: number,
  body: ResponseBody = {}
) => ({
  body: JSON.stringify(body),
  headers: {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN as string,
    'Access-Control-Allow-Methods': 'OPTIONS, POST'
  },
  statusCode
});

const dynamoDbClient = new DynamoDBClient({});

export const getUser = (sub: string) => {
  const getItemCommand = new GetItemCommand({
    Key: { id: { S: sub } },
    TableName: process.env.USER_TABLE_NAME
  });

  return dynamoDbClient.send(getItemCommand);
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
