import { APIGatewayTokenAuthorizerWithContextHandler } from 'aws-lambda';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

export type UserContext = {
  sub: string;
  username: string;
};

export const handler: APIGatewayTokenAuthorizerWithContextHandler<
  UserContext
> = async (event) => {
  const { authorizationToken } = event;

  if (!authorizationToken) throw new Error('Unauthorized');

  const verifier = CognitoJwtVerifier.create({
    clientId: process.env.USER_POOL_CLIENT_ID as string,
    tokenUse: 'access',
    userPoolId: process.env.USER_POOL_ID as string
  });

  let userContext: UserContext;

  try {
    const { sub, username } = await verifier.verify(authorizationToken);

    userContext = {
      sub,
      username
    };
  } catch {
    throw new Error('Unauthorized');
  }

  const policyDocument = {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'execute-api:Invoke',
        Effect: 'Allow',
        Resource: event.methodArn
      }
    ]
  };

  return {
    principalId: userContext.sub,
    policyDocument,
    context: userContext
  };
};
