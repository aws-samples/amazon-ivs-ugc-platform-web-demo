import { UNAUTHORIZED_EXCEPTION } from '../shared/constants';

export const CognitoJwtVerifier = {
  create: () => {
    return {
      verify: (token: string) => {
        if (token === 'validToken') return { sub: 'sub', username: 'username' };

        throw new Error(UNAUTHORIZED_EXCEPTION);
      }
    };
  }
};
