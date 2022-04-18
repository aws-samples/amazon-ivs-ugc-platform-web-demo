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

const cognitoParams = { UserPoolId: userPoolId, ClientId: userPoolClientId };

export { cognitoParams, apiBaseUrl };
