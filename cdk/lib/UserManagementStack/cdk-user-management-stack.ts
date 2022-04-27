import {
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as origins,
  aws_cognito as cognito,
  aws_dynamodb as dynamodb,
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_iam as iam,
  NestedStack,
  NestedStackProps,
  RemovalPolicy
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { UserManagementResourceConfig } from './constants';
import UserManagementCognitoTriggers from './Constructs/UserManagementCognitoTriggers';
import UserManagementService from './Constructs/UserManagementService';
import UserManagementServiceRole from './Constructs/UserManagementServiceRole';

interface UserManagementStackProps extends NestedStackProps {
  // The image should include the userManagement routers (authenticated and unauthenticated)
  containerImage: ecs.AssetImage;
  resourceConfig: UserManagementResourceConfig;
  vpc?: ec2.IVpc;
}

export class UserManagementStack extends NestedStack {
  public readonly ecsTaskExecutionRole: iam.Role;
  public readonly outputs: { [key: string]: string };

  constructor(scope: Construct, id: string, props: UserManagementStackProps) {
    super(scope, id, props);

    const stackNamePrefix = 'UserManagement';
    const { containerImage, resourceConfig, vpc } = props;

    // Configuration variables based on the stage (dev or prod)
    const { allowedOrigin, enableUserAutoVerify, ivsChannelType } =
      resourceConfig;

    // Dynamo DB User Table
    const userTable = new dynamodb.Table(this, `${stackNamePrefix}-UserTable`, {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY
    });

    userTable.addGlobalSecondaryIndex({
      indexName: 'emailIndex',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING }
    });

    // Cognito Lambda triggers
    const { customMessageLambda, preSignUpLambda } =
      new UserManagementCognitoTriggers(
        this,
        `${stackNamePrefix}-UserManagementCognitoTriggers`,
        { ...resourceConfig }
      );

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, `${stackNamePrefix}-UserPool`, {
      ...(!enableUserAutoVerify
        ? {
            // autoVerify is used to set the attribute that Cognito will use to verify users, but will not actually verify the email automatically (the user will still need to verify it upon sign-up)
            autoVerify: { email: true }
          }
        : {}),
      lambdaTriggers: {
        ...(enableUserAutoVerify ? { preSignUp: preSignUpLambda } : {}),
        customMessage: customMessageLambda
      },
      removalPolicy: RemovalPolicy.DESTROY,
      selfSignUpEnabled: true,
      signInAliases: { preferredUsername: true, username: true },
      standardAttributes: {
        email: {
          required: true,
          mutable: false
        }
      }
    });

    // User Pool Client
    const userPoolClient = new cognito.UserPoolClient(
      this,
      `${stackNamePrefix}-UserPoolClient`,
      {
        authFlows: { userPassword: true },
        userPool
      }
    );

    // Task Execution IAM Role
    const { iamRole: ecsTaskExecutionRole } = new UserManagementServiceRole(
      this,
      `${stackNamePrefix}-UserManagementServiceRole`,
      { prefix: stackNamePrefix, userPool, userTable }
    );
    this.ecsTaskExecutionRole = ecsTaskExecutionRole;

    // Load Balancer -> Cluster -> Service + Autoscaling -> Tasks
    const { loadBalancer } = new UserManagementService(
      this,
      `${stackNamePrefix}-UserManagementService`,
      {
        ...resourceConfig,
        containerImage,
        ecsTaskExecutionRole,
        environment: {
          ACCOUNT_ID: NestedStack.of(this).account,
          ALLOWED_ORIGIN: allowedOrigin,
          IVS_CHANNEL_TYPE: ivsChannelType,
          REGION: NestedStack.of(this).region,
          USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
          USER_POOL_ID: userPool.userPoolId,
          USER_TABLE_NAME: userTable.tableName
        },
        prefix: stackNamePrefix,
        vpc
      }
    );

    // Cloudfront Distribution
    const distribution = new cloudfront.Distribution(
      this,
      `${stackNamePrefix}-CFDistribution`,
      {
        defaultBehavior: {
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
          origin: new origins.LoadBalancerV2Origin(loadBalancer, {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY
          })
        }
      }
    );

    // Stack Outputs
    this.outputs = {
      userManagementApiBaseUrl: `https://${distribution.domainName}`,
      userPoolId: userPool.userPoolId,
      userPoolClientId: userPoolClient.userPoolClientId
    };
  }
}
