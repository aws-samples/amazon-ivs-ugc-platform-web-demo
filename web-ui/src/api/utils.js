class CDKOutputError extends Error {
  constructor(message, description = '') {
    super(message);
    this.name = 'CDKOutputError';
  }
}

class FallbackEnvsError extends Error {
  constructor(message, description = '') {
    super(message);
    this.name = 'FallbackEnvsError';
  }
}

let apiBaseUrl, userPoolId, userPoolClientId;
let tryFallbacks = true;
let error;

try {
  // First, we try to access the backend variables from the cdk_output.json file, if it exists
  const STACK_OUTPUT = require('../cdk_output.json');
  apiBaseUrl = STACK_OUTPUT.userManagementApiGatewayEndpoint;
  userPoolId = STACK_OUTPUT.userPoolId;
  userPoolClientId = STACK_OUTPUT.userPoolClientId;

  if (!apiBaseUrl || !userPoolId || !userPoolClientId) {
    throw new CDKOutputError(
      `The cdk_output.json file was found, but at least one of the following values was missing:
- API Base URL: ${apiBaseUrl} \n- Cognito User Pool ID: ${userPoolId} \n- Cognito User Pool Client ID: ${userPoolClientId} \n`
    );
  }

  tryFallbacks = false;
} catch (err) {
  if (err instanceof CDKOutputError) {
    // We have the cdk_output.json file, but it's missing some information
    error = err;
    tryFallbacks = false;
  } else {
    // We don't have the cdk_output.json file, so we will try the fallbacks
    console.warn(
      'No cdk_output.json file was found. \n\nUsing FALLBACK environment variables.'
    );
  }
} finally {
  if (tryFallbacks) {
    // Trying fallback environment variables
    const {
      REACT_APP_FALLBACK_API_BASE_URL,
      REACT_APP_FALLBACK_COGNITO_USER_POOL_ID,
      REACT_APP_FALLBACK_COGNITO_USER_POOL_CLIENT_ID
    } = process.env;

    apiBaseUrl = REACT_APP_FALLBACK_API_BASE_URL;
    userPoolId = REACT_APP_FALLBACK_COGNITO_USER_POOL_ID;
    userPoolClientId = REACT_APP_FALLBACK_COGNITO_USER_POOL_CLIENT_ID;

    if (!apiBaseUrl || !userPoolId || !userPoolClientId)
      // We don't have all the required fallback variables, so we throw an error
      error = new FallbackEnvsError(
        `At least one of the following fallback environment variables was not found: 
- REACT_APP_FALLBACK_API_BASE_URL: ${REACT_APP_FALLBACK_API_BASE_URL} \n- REACT_APP_FALLBACK_COGNITO_USER_POOL_ID: ${REACT_APP_FALLBACK_COGNITO_USER_POOL_ID} \n- REACT_APP_FALLBACK_COGNITO_CLIENT_ID: ${REACT_APP_FALLBACK_COGNITO_USER_POOL_CLIENT_ID} \n`
      );
  }
}

if (error) console.error(error);

const cognitoParams = { UserPoolId: userPoolId, ClientId: userPoolClientId };

export { cognitoParams, apiBaseUrl };
