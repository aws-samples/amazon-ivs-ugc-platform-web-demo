const { readFileSync, writeFileSync } = require('fs');

const inputPath = 'temp_out.json';
const json = readFileSync(inputPath);
const output = JSON.parse(json);

const { apiBaseUrl, region, stage, userPoolClientId, userPoolId } =
  output[`UGC-${process.argv[2]}`];

const outputPath = '../web-ui/.env';
writeFileSync(
  outputPath,
  `REACT_APP_API_BASE_URL=${apiBaseUrl}\nREACT_APP_COGNITO_USER_POOL_CLIENT_ID=${userPoolClientId}\nREACT_APP_COGNITO_USER_POOL_ID=${userPoolId}\nREACT_APP_REGION=${region}\nREACT_APP_STAGE=${stage}`
);
