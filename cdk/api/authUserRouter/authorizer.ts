import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { FastifyRequest } from 'fastify';

export type UserContext = {
  sub: string;
  username: string;
};

const verifier = CognitoJwtVerifier.create({
  clientId: process.env.USER_POOL_CLIENT_ID as string,
  tokenUse: 'access',
  userPoolId: process.env.USER_POOL_ID as string
});

const authorizer = async (request: FastifyRequest) => {
  const { authorization: authorizationToken } = request.headers;

  if (!authorizationToken || typeof authorizationToken !== 'string')
    throw new Error('Unauthorized');

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

  request.requestContext.set('user', userContext);
};

export default authorizer;
