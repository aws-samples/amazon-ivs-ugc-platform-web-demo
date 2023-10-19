import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { FastifyRequest } from 'fastify';

import { UNAUTHORIZED_EXCEPTION } from '../shared/constants';

export type UserContext = {
  sub: string;
  username: string;
};

const verifier = CognitoJwtVerifier.create({
  clientId: process.env.USER_POOL_CLIENT_ID as string,
  tokenUse: 'access',
  userPoolId: process.env.USER_POOL_ID as string
});

const isBeaconRoute = (url: string) => ['/stages/disconnect'].includes(url)

const getAuthorizationToken = (request: FastifyRequest) => {
  const { authorization: authTokenFromHeaders } = request?.headers;

  if (authTokenFromHeaders) return authTokenFromHeaders

  // Beacon requests cannot pass auth token via request header, therefore, token is passed through the body
  if (isBeaconRoute(request.url) && request.body) {
    const parsedBody = JSON.parse(request.body as any)
    const authTokenFromBeacon = parsedBody?.authTokenFromBeaconRequest

    if (authTokenFromBeacon) {
      return authTokenFromBeacon
    }
  }

  return null
}

const authorizer = async (request: FastifyRequest) => {
  const authorizationToken = getAuthorizationToken(request)

  if (!authorizationToken || typeof authorizationToken !== 'string')
    throw new Error(UNAUTHORIZED_EXCEPTION);

  let userContext: UserContext;

  try {
    const { sub, username } = await verifier.verify(authorizationToken);

    userContext = {
      sub,
      username
    };
  } catch {
    throw new Error(UNAUTHORIZED_EXCEPTION);
  }

  request.requestContext?.set('user', userContext);

  return userContext;
};

export default authorizer;
