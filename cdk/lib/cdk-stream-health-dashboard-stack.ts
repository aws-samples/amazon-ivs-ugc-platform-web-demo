import path from 'path';

import {
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_iam as iam,
  CfnOutput,
  Stack,
  StackProps
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { UserManagementResourceConfig } from './UserManagementStack/constants';
import { UserManagementStack } from './UserManagementStack/cdk-user-management-stack';

interface StreamHealthDashboardStackProps extends StackProps {
  resourceConfig: UserManagementResourceConfig;
}

export class StreamHealthDashboardStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: StreamHealthDashboardStackProps
  ) {
    super(scope, id, props);

    const { resourceConfig } = props;
    const { maxAzs, natGateways } = resourceConfig;
    const stackNamePrefix = Stack.of(this).stackName;

    // VPC
    const vpc = new ec2.Vpc(this, `${stackNamePrefix}-VPC`, {
      maxAzs,
      natGateways
    });

    // Container image
    const containerImage = ecs.ContainerImage.fromAsset(
      path.join(__dirname, '../api')
    );

    const {
      ecsTaskExecutionRole,
      outputs: { userManagementApiBaseUrl, userPoolId, userPoolClientId }
    } = new UserManagementStack(this, `UserManagement`, {
      containerImage,
      resourceConfig,
      vpc
    });

    // IAM permissions required for the stream health dashboard
    const metricsIvsPolicyStatement = new iam.PolicyStatement({
      actions: ['ivs:GetStreamSession', 'ivs:ListStreamSessions'],
      effect: iam.Effect.ALLOW,
      resources: ['*']
    });
    ecsTaskExecutionRole.addToPolicy(metricsIvsPolicyStatement);

    new CfnOutput(this, 'userManagementApiBaseUrl', {
      value: userManagementApiBaseUrl
    });
    new CfnOutput(this, 'userPoolId', { value: userPoolId });
    new CfnOutput(this, 'userPoolClientId', { value: userPoolClientId });
  }
}
