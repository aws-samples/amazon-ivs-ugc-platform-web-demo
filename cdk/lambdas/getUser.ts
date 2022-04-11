import { APIGatewayProxyWithCognitoAuthorizerHandler } from 'aws-lambda';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';

import { createResponse, ResponseBody } from './utils';

const dynamoDbClient = new DynamoDBClient({});

export const handler: APIGatewayProxyWithCognitoAuthorizerHandler = async (
  event
) => {
  const {
    requestContext: { authorizer: authorizerContext }
  } = event;
  const {
    claims: { ['cognito:username']: username, sub }
  } = authorizerContext;
  const responseBody: ResponseBody = { username };

  // Get user from userTable
  const getItemCommand = new GetItemCommand({
    Key: { id: { S: sub } },
    TableName: process.env.USER_TABLE_NAME
  });

  try {
    const { Item = {} } = await dynamoDbClient.send(getItemCommand);

    const {
      channelArn: { S: channelArn },
      ingestEndpoint: { S: ingestEndpoint },
      playbackUrl: { S: playbackUrl },
      streamKeyValue: { S: streamKeyValue }
    } = Item;

    responseBody.channelArn = channelArn;
    responseBody.ingestEndpoint = ingestEndpoint;
    responseBody.streamKeyValue = streamKeyValue;
    responseBody.playbackUrl = playbackUrl;
  } catch (error) {
    console.error(error);

    return createResponse(500);
  }

  return createResponse(200, responseBody);
};
