#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';

import { UGCFrontendDeploymentStack } from '../lib/cdk-deploy-frontend-app';
import { UGCResourceWithUserManagementConfig } from '../lib/constants';
import { UGCStack } from '../lib/cdk-ugc-stack';

const app = new App();

// Get the value of the current stage "dev" or "prod"
const stage = app.node.tryGetContext('stage');
let shouldPublish = app.node.tryGetContext('publish');
shouldPublish = shouldPublish === 'true';
// Get the config for the current stage
const {
  resourceConfig
}: { resourceConfig: UGCResourceWithUserManagementConfig } =
  app.node.tryGetContext(stage);
const ugcStackId = `UGC-${stage}`;
const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;

new UGCStack(app, ugcStackId, {
  env: { account, region },
  resourceConfig,
  shouldPublish
});

new UGCFrontendDeploymentStack(app, `UGC-Frontend-Deployment-${stage}`, {
  env: { account, region },
  ugcStackId
});
