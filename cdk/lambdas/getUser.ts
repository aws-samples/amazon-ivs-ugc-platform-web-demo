import { APIGatewayProxyWithCognitoAuthorizerHandler } from 'aws-lambda';

import { createResponse, getUser, ResponseBody } from './utils';

interface GetUserResponseBody extends ResponseBody {
  ingestEndpoint?: string;
  playbackUrl?: string;
  streamKeyValue?: string;
  username?: string;
}

export const handler: APIGatewayProxyWithCognitoAuthorizerHandler = async (
  event
) => {
  const {
    requestContext: { authorizer: authorizerContext }
  } = event;
  const {
    claims: { ['cognito:username']: username, sub }
  } = authorizerContext;
  const responseBody: GetUserResponseBody = { username };

  try {
    // Get user from userTable
    const { Item = {} } = await getUser(sub);

    const {
      ingestEndpoint: { S: ingestEndpoint },
      playbackUrl: { S: playbackUrl },
      streamKeyValue: { S: streamKeyValue }
    } = Item;

    responseBody.ingestEndpoint = ingestEndpoint;
    responseBody.streamKeyValue = streamKeyValue;
    responseBody.playbackUrl = playbackUrl;
  } catch (error) {
    console.error(error);

    return createResponse(500);
  }

  return createResponse(200, responseBody);
};
