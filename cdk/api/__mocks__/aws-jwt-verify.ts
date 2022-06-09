export const CognitoJwtVerifier = {
  create: () => {
    return {
      verify: (token: string) => {
        if (token === 'validToken') return { sub: 'sub', username: 'username' };

        throw new Error('Unauthorized');
      }
    };
  }
};
