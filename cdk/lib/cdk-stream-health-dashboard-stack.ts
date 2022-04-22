import { aws_ec2 as ec2, CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import {
  ResourceConfig,
  UserManagementStack
} from './cdk-user-management-stack';

interface StreamHealthDashboardStackProps extends StackProps {
  resourceConfig: ResourceConfig;
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

    const {
      outputs: { userManagementApiBaseUrl, userPoolId, userPoolClientId }
    } = new UserManagementStack(this, `UserManagement`, {
      resourceConfig,
      vpc
    });

    new CfnOutput(this, 'userManagementApiBaseUrl', {
      value: userManagementApiBaseUrl
    });
    new CfnOutput(this, 'userPoolId', { value: userPoolId });
    new CfnOutput(this, 'userPoolClientId', { value: userPoolClientId });
  }
}
