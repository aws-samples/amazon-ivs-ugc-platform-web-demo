import { APIGatewayProxyWithLambdaAuthorizerHandler } from 'aws-lambda';

import { createResponse, ResponseBody } from './utils';
import { getUser } from './utils/userManagementHelpers';
import { UserContext } from './authorizer';

interface GetUserResponseBody extends ResponseBody {
  ingestEndpoint?: string;
  playbackUrl?: string;
  streamKeyValue?: string;
  username: string;
}

export const handler: APIGatewayProxyWithLambdaAuthorizerHandler<
  UserContext
> = async (event) => {
  const {
    requestContext: {
      authorizer: { sub, username }
    }
  } = event;
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
