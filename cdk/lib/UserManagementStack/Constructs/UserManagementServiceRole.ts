import {
  aws_cognito as cognito,
  aws_dynamodb as dynamodb,
  aws_iam as iam
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface UserManagementServiceRoleProps {
  prefix: string;
  userPool: cognito.UserPool;
  userTable: dynamodb.Table;
}

export default class UserManagementServiceRole extends Construct {
  public readonly iamRole: iam.Role;

  constructor(
    scope: Construct,
    id: string,
    props: UserManagementServiceRoleProps
  ) {
    super(scope, id);

    const { prefix, userPool, userTable } = props;

    const ecsTaskExecutionRole = new iam.Role(this, `${prefix}-Role`, {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description:
        'ECS task to pull container images and publish container logs to Amazon CloudWatch'
    });
    ecsTaskExecutionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AmazonECSTaskExecutionRolePolicy'
      )
    );
    userTable.grantReadWriteData(ecsTaskExecutionRole);
    const forgotPasswordPolicyStatement = new iam.PolicyStatement({
      actions: ['cognito-idp:ForgotPassword'],
      effect: iam.Effect.ALLOW,
      resources: [userPool.userPoolArn]
    });
    const ivsPolicyStatement = new iam.PolicyStatement({
      actions: [
        'ivs:CreateChannel',
        'ivs:CreateStreamKey',
        'ivs:DeleteChannel',
        'ivs:DeleteStreamKey',
        'ivs:StopStream'
      ],
      effect: iam.Effect.ALLOW,
      resources: ['*']
    });
    const deleteUserPolicyStatement = new iam.PolicyStatement({
      actions: [
        'cognito-idp:AdminDeleteUser',
        'cognito-idp:AdminDisableUser',
        'cognito-idp:AdminGetUser',
        'cognito-idp:AdminUpdateUserAttributes'
      ],
      effect: iam.Effect.ALLOW,
      resources: [userPool.userPoolArn]
    });
    ecsTaskExecutionRole.addToPolicy(forgotPasswordPolicyStatement);
    ecsTaskExecutionRole.addToPolicy(ivsPolicyStatement);
    ecsTaskExecutionRole.addToPolicy(deleteUserPolicyStatement);

    this.iamRole = ecsTaskExecutionRole;
  }
}
