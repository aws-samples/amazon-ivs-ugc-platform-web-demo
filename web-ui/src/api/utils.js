import { promisify } from 'util';
import { CognitoUser, CognitoUserPool } from 'amazon-cognito-identity-js';

class SessionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SessionError';
  }
}

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

export const userPool = new CognitoUserPool(COGNITO_PARAMS);

export const getCognitoUser = async (username) => {
  const { result: session } = await getCurrentSession();
  let cognitoUser = userPool.getCurrentUser();

  if (!cognitoUser && username) {
    const cognitoUserData = { Pool: userPool, Username: username };
    cognitoUser = new CognitoUser(cognitoUserData);
  }

  if (session) cognitoUser?.setSignInUserSession(session);

  cognitoUser?.setAuthenticationFlowType('USER_PASSWORD_AUTH');

  return cognitoUser;
};

export const authFetch = async ({
  url,
  method = 'GET',
  body = {},
  includeUserData = false
}) => {
  let result, error;

  try {
    const { result: session, error: sessionError } = await getCurrentSession();
    if (sessionError) throw sessionError;

    const accessToken = session.getAccessToken().getJwtToken();
    const tokenPayload = session.getIdToken().decodePayload();
    const userData = {
      username: tokenPayload['cognito:username'],
      email: tokenPayload.email
    };
    const bodyPayload = JSON.stringify({
      ...body,
      ...(includeUserData ? userData : {})
    });

    const response = await fetch(url, {
      ...(method !== 'GET' ? { body: bodyPayload } : {}),
      headers: { Authorization: accessToken },
      method
    });
    const data = await response.json();

    if (response.ok) {
      result = data;
    } else {
      // API Errors
      error = data;
    }
  } catch (err) {
    // Other Errors
    error = err;
  }

  if (error) console.error(error);

  return { result, error };
};

export const unauthFetch = async ({ url, method = 'GET', body }) => {
  let result, error;

  try {
    const response = await fetch(url, {
      body: JSON.stringify(body),
      method
    });

    const data = await response.json();

    if (response.ok) {
      result = data;
    } else {
      // API Errors
      error = data;
    }
  } catch (err) {
    // Other Errors
    error = err;
  }

  if (error) console.error(error);

  return { result, error };
};

/**
 * Gets the session details of the currently authenticated Cognito user, if one exists.
 */
export const getCurrentSession = async () => {
  const cognitoUser = userPool.getCurrentUser();
  let result, error;

  try {
    if (!cognitoUser) throw new SessionError('No Authenticated User Exists');

    cognitoUser.getSession[promisify.custom] = () =>
      new Promise((resolve, reject) => {
        cognitoUser.getSession((err, session) => {
          if (session) resolve(session);
          reject(err);
        });
      });

    const getSession = promisify(cognitoUser.getSession);
    const session = await getSession();

    if (!session.isValid()) throw new SessionError('Invalid Session');

    result = session;
  } catch (err) {
    error = err;

    if (!(err instanceof SessionError)) {
      console.error(err);
    }
  }

  return { result, error };
};

export { apiBaseUrl };
