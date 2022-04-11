class CDKOutputError extends Error {
  constructor(message, description = '') {
    super(message);
    this.name = 'CDKOutputError';
  }
}

let apiBaseUrl, userPoolId, userPoolClientId;
let error;

// Trying fallback environment variables
const {
  REACT_APP_API_BASE_URL,
  REACT_APP_COGNITO_USER_POOL_ID,
  REACT_APP_COGNITO_USER_POOL_CLIENT_ID
} = process.env;

apiBaseUrl = REACT_APP_API_BASE_URL;
userPoolId = REACT_APP_COGNITO_USER_POOL_ID;
userPoolClientId = REACT_APP_COGNITO_USER_POOL_CLIENT_ID;

if (!apiBaseUrl || !userPoolId || !userPoolClientId)
  // We don't have all the required fallback variables, so we throw an error
  error = new CDKOutputError(
    `At least one of the following fallback environment variables was not found: 
- REACT_APP_API_BASE_URL: ${REACT_APP_API_BASE_URL} \n- REACT_APP_COGNITO_USER_POOL_ID: ${REACT_APP_COGNITO_USER_POOL_ID} \n- REACT_APP_COGNITO_USER_POOL_CLIENT_ID: ${REACT_APP_COGNITO_USER_POOL_CLIENT_ID} \n`
  );

if (error) console.error(error);

const cognitoParams = { UserPoolId: userPoolId, ClientId: userPoolClientId };

export { cognitoParams, apiBaseUrl };
