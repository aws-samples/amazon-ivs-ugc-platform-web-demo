#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';

import { StreamHealthDashboardStack } from '../lib/cdk-stream-health-dashboard-stack';
import { UserManagementResourceConfig } from '../lib/UserManagementStack/constants';

const app = new App();

// Get the value of the current stage "dev" or "prod"
const stage = app.node.tryGetContext('stage');
// Get the config for the current stage
const { resourceConfig }: { resourceConfig: UserManagementResourceConfig } =
  app.node.tryGetContext(stage);

new StreamHealthDashboardStack(new App(), `StreamHealthDashboard-${stage}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  },
  resourceConfig
});
