const getApiBaseUrl = async () => {
  let apiBaseUrl;

  try {
    const STACK_OUTPUT = require('cdk_output.json');
    apiBaseUrl = STACK_OUTPUT.userManagementApiGatewayEndpoint;

    if (!apiBaseUrl) throw new Error();
  } catch (error) {
    console.warn(
      'No cdk_output.json file containing the API Base URL was found. Using the REACT_APP_FALLBACK_API_BASE_URL environment variable.'
    );

    apiBaseUrl = process.env.REACT_APP_FALLBACK_API_BASE_URL;

    if (!apiBaseUrl)
      console.error(
        'No REACT_APP_FALLBACK_API_BASE_URL environment variable was found.'
      );
  }

  return apiBaseUrl;
};

/**
 * Register a new user
 * @param {object} userData information about the new user
 * @param {string} userData.username
 * @param {string} userData.email
 * @param {string} userData.password
 */
export const register = async (userData) => {
  const { username, email, password } = userData;
  const apiBaseUrl = await getApiBaseUrl();
  if (!apiBaseUrl) return;

  const response = await fetch(`${apiBaseUrl}register`, {
    method: 'POST',
    body: JSON.stringify({ username, email, password })
  });
  const data = await response.json();

  console.log('User Registered', data);
};

/**
 * Sign in an existing user
 * @param {object} userData information about the new user
 * @param {string} userData.username
 * @param {string} userData.password
 */
export const signIn = async (userData) => {
  const { username, password } = userData;
  const apiBaseUrl = await getApiBaseUrl();
  if (!apiBaseUrl) return;

  const response = await fetch(`${apiBaseUrl}login`, {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  const data = await response.json();

  console.log('User Signed In', data);
};

/**
 * Recover the password of an existing user
 * @param {object} userData information about the new user
 * @param {string} userData.email
 */
export const recoverPassword = async (userData) => {
  const { email } = userData;
  const apiBaseUrl = await getApiBaseUrl();
  if (!apiBaseUrl) return;

  const response = await fetch(`${apiBaseUrl}recover`, {
    method: 'POST',
    body: JSON.stringify({ email })
  });
  const data = await response.json();

  console.log('Pasword Recovery Requested', data);
};
