import { CognitoUser, CognitoUserPool } from 'amazon-cognito-identity-js';

const {
  REACT_APP_API_BASE_URL,
  REACT_APP_COGNITO_USER_POOL_ID,
  REACT_APP_COGNITO_USER_POOL_CLIENT_ID
} = process.env;

const apiBaseUrl = REACT_APP_API_BASE_URL;
const userPoolId = REACT_APP_COGNITO_USER_POOL_ID;
const userPoolClientId = REACT_APP_COGNITO_USER_POOL_CLIENT_ID;

if (!apiBaseUrl || !userPoolId || !userPoolClientId)
  console.error(
    new Error(
      `At least one of the following fallback environment variables was not found: 
- REACT_APP_API_BASE_URL: ${REACT_APP_API_BASE_URL} \n- REACT_APP_COGNITO_USER_POOL_ID: ${REACT_APP_COGNITO_USER_POOL_ID} \n- REACT_APP_COGNITO_USER_POOL_CLIENT_ID: ${REACT_APP_COGNITO_USER_POOL_CLIENT_ID} \n`
    )
  );

const COGNITO_PARAMS = { UserPoolId: userPoolId, ClientId: userPoolClientId };

const userPool = new CognitoUserPool(COGNITO_PARAMS);

const getCognitoUser = (username) => {
  const cognitoUser = new CognitoUser({ Pool: userPool, Username: username });
  cognitoUser.setAuthenticationFlowType('USER_PASSWORD_AUTH');
  return cognitoUser;
};

class SessionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SessionError';
  }
}

export { getCognitoUser, userPool, apiBaseUrl, SessionError };
