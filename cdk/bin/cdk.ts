#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';

import { UGCFrontendDeploymentStack } from '../lib/cdk-deploy-frontend-app';
import { UGCResourceWithChannelsConfig } from '../lib/constants';
import { UGCStack } from '../lib/cdk-ugc-stack';

const app = new App();

// Get the value of the current stage "dev" or "prod"
const stage = app.node.tryGetContext('stage');
const stackName = app.node.tryGetContext('stackName');
const shouldPublish = app.node.tryGetContext('publish') === 'true';
const scheduleExp = app.node.tryGetContext('scheduleExp');
// Get the config for the current stage
const { resourceConfig }: { resourceConfig: UGCResourceWithChannelsConfig } =
  app.node.tryGetContext(stage);
const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;

new UGCStack(app, stackName, {
  env: { account, region },
  tags: { stage, project: 'ugc' },
  resourceConfig,
  shouldPublish,
  scheduleExp
});

new UGCFrontendDeploymentStack(app, `UGC-Frontend-Deployment-${stage}`, {
  env: { account, region },
  tags: { stage, project: 'ugc' },
  ugcStackId: stackName
});
