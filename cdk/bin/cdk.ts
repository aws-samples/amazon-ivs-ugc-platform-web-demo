#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';

import {
  ResourceConfig,
  UserManagementStack
} from '../lib/cdk-user-management-stack';

const app = new App();

// Get the value of the current stage "dev" or "prod"
const stage = app.node.tryGetContext('stage');
// Get the config for the current stage
const { resourceConfig }: { resourceConfig: ResourceConfig } =
  app.node.tryGetContext(stage);

new UserManagementStack(
  new App(),
  `StreamHealthDashboardUserManagementStack-${stage}`,
  {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION
    }
  },
  resourceConfig
);
