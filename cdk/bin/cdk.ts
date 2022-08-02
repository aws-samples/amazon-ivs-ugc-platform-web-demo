#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';

import { UGCStack } from '../lib/cdk-ugc-stack';
import { UGCResourceWithUserManagementConfig } from '../lib/constants';

const app = new App();

// Get the value of the current stage "dev" or "prod"
const stage = app.node.tryGetContext('stage');
// Get the config for the current stage
const {
  resourceConfig
}: { resourceConfig: UGCResourceWithUserManagementConfig } =
  app.node.tryGetContext(stage);

new UGCStack(new App(), `UGC-${stage}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  },
  resourceConfig
});
