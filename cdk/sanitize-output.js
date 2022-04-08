const { readFileSync, writeFileSync } = require('fs');

const inputPath = 'temp_out.json';
const json = readFileSync(inputPath);
const output = JSON.parse(json);

const { userPoolClientId, userPoolId } =
  output[`StreamHealthDashboardUserManagementStack-${process.argv[2]}`];
const publicCdkOutput = { userPoolClientId, userPoolId };

const outputPath = '../web-ui/src/cdk_output.json';
writeFileSync(outputPath, JSON.stringify(publicCdkOutput));
