import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { FastifyRequest } from 'fastify';

import { BEACON_API_ROUTES, UNAUTHORIZED_EXCEPTION } from '../shared/constants';

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
