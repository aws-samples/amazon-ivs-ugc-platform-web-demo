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
  REACT_APP_COGNITO_USER_POOL_CLIENT_ID,
  REACT_APP_REGION,
  REACT_APP_E2E_TEST,
  REACT_APP_WEB_SOCKET_SERVER_PORT = 8081
} = process.env;

export const apiBaseUrl = REACT_APP_API_BASE_URL;
const userPoolId = REACT_APP_COGNITO_USER_POOL_ID;
const userPoolClientId = REACT_APP_COGNITO_USER_POOL_CLIENT_ID;
const region = REACT_APP_REGION;
const isE2eTestBuild = REACT_APP_E2E_TEST;
const webSocketServerPort = REACT_APP_WEB_SOCKET_SERVER_PORT;

if (!apiBaseUrl || !userPoolId || !userPoolClientId || !region)
  console.error(
    new Error(
      `At least one of the following environment variables was not found: 
    - REACT_APP_API_BASE_URL: ${REACT_APP_API_BASE_URL} \n- REACT_APP_COGNITO_USER_POOL_ID: ${REACT_APP_COGNITO_USER_POOL_ID} \n- REACT_APP_COGNITO_USER_POOL_CLIENT_ID: ${REACT_APP_COGNITO_USER_POOL_CLIENT_ID} \n- REACT_APP_REGION: ${REACT_APP_REGION} \n`
    )
  );

export const ivsChatWebSocketRegionOrUrl =
  isE2eTestBuild === 'true'
    ? `ws://localhost:${webSocketServerPort}/ws`
    : REACT_APP_REGION;

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

export const authFetch = async ({
  url,
  method = 'GET',
  body = {},
  includeUserData = false,
  signal
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
      headers: {
        Authorization: accessToken,
        'Content-Type': 'application/json'
      },
      method,
      signal
    });

    let data;
    if (response.status !== 204) {
      data = await response.json();
      data.id = tokenPayload['sub']
    }

    if (response.ok) {
      result = data || 'SUCCESS';
    } else {
      // API Errors
      error = data || 'ERROR';
    }
  } catch (err) {
    // Other Errors
    error = err;
  }
  
  return { result, error };
};

export const unauthFetch = async ({ url, method = 'GET', body, signal }) => {
  let result, error;

  try {
    const response = await fetch(url, {
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
      method,
      signal
    });

    let data;
    if (response.status !== 204) {
      data = await response.json();
    }

    if (response.ok) {
      result = data || 'SUCCESS';
    } else {
      // API Errors
      error = data || 'ERROR';
    }
  } catch (err) {
    // Other Errors
    error = err;
  }

  if (error) console.error(error);

  return { result, error };
};

export const generatePresignedPost = ({ assetType, contentType }) =>
  authFetch({
    method: 'POST',
    url: `${apiBaseUrl}/channel/assets/imagePresignedPost/create`,
    body: { assetType, contentType }
  });
