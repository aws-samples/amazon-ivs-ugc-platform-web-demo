const { readFileSync, writeFileSync } = require('fs');

const inputPath = 'temp_out.json';
const json = readFileSync(inputPath);
const output = JSON.parse(json);

const { userManagementApiBaseUrl, userPoolClientId, userPoolId } =
  output[`StreamHealthDashboard-${process.argv[2]}`];
const publicCdkOutput = {
  userManagementApiBaseUrl,
  userPoolClientId,
  userPoolId
};

const outputPath = '../web-ui/.env';
writeFileSync(
  outputPath,
  `REACT_APP_API_BASE_URL=${userManagementApiBaseUrl}\nREACT_APP_COGNITO_USER_POOL_CLIENT_ID=${userPoolClientId}\nREACT_APP_COGNITO_USER_POOL_ID=${userPoolId}`
);
