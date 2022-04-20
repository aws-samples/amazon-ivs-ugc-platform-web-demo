import path from 'path';

import {
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as origins,
  aws_cognito as cognito,
  aws_dynamodb as dynamodb,
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_elasticloadbalancingv2 as elbv2,
  aws_iam as iam,
  aws_lambda_nodejs as lambda,
  aws_logs as logs,
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  StackProps
} from 'aws-cdk-lib';
import { ChannelType } from '@aws-sdk/client-ivs';
import { Construct } from 'constructs';
import crypto from 'crypto';

import { getLambdaEntryPath } from './utils';

export interface ResourceConfig {
  allowedOrigin: string;
  userManagementClientBaseUrl: string;
  enableUserAutoVerify: boolean;
  ivsChannelType: ChannelType;
  logRetention?: logs.RetentionDays;
  stageName: string;
}

export class UserManagementStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: StackProps,
    resourceConfig: ResourceConfig
  ) {
    super(scope, id, props);

    const stackNamePrefix = this.stackName;

    // Configuration variables based on the stage (dev or prod)
    const {
      allowedOrigin,
      userManagementClientBaseUrl,
      enableUserAutoVerify,
      ivsChannelType,
      logRetention
    } = resourceConfig;

    // Default lambda parameters
    const defaultLambdaParams = {
      ...(logRetention ? { logRetention } : {}),
      bundling: { minify: true }
    };

    /**
     * Dynamo DB User Table
     */

    const userTable = new dynamodb.Table(this, `${stackNamePrefix}-UserTable`, {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY
    });

    userTable.addGlobalSecondaryIndex({
      indexName: 'emailIndex',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING }
    });

    /**
     * Cognito Lambda Triggers
     */

    // Lambda to auto verify new users, not suitable for production
    let preSignUpLambda;

    if (enableUserAutoVerify) {
      preSignUpLambda = new lambda.NodejsFunction(this, 'PreSignUpLambda', {
        ...defaultLambdaParams,
        entry: getLambdaEntryPath('cognitoTriggers/preSignUp'),
        environment: { ENABLE_USER_AUTO_VERIFY: `${enableUserAutoVerify}` }
      });
    }

    // Lambda to auto verify new users, not suitable for production
    const customMessageLambda = new lambda.NodejsFunction(
      this,
      'CustomMessageLambda',
      {
        ...defaultLambdaParams,
        entry: getLambdaEntryPath('cognitoTriggers/customMessage'),
        environment: {
          USER_MANAGEMENT_CLIENT_BASE_URL: userManagementClientBaseUrl
        }
      }
    );

    /**
     * Cognito User Pool
     */

    // Create user pool
    const userPool = new cognito.UserPool(this, `${stackNamePrefix}-UserPool`, {
      ...(!enableUserAutoVerify
        ? {
            // autoVerify is used to set the attribute that Cognito will use to verify users, but will not actually verify the email automatically (the user will still need to verify it upon sign-up)
            autoVerify: { email: true },
            userVerification: {
              emailStyle: cognito.VerificationEmailStyle.LINK
            }
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

    if (!enableUserAutoVerify) {
      // Cognito requires a domain when the email verification style is set to LINK
      const domainPrefixId = crypto
        .createHash('sha256')
        .update(`${Stack.of(this).account}${Stack.of(this).stackName}`)
        .digest('hex')
        .substring(0, 12);

      userPool.addDomain('CognitoDomain', {
        cognitoDomain: {
          domainPrefix: `stream-health-dashboard-${domainPrefixId}`
        }
      });
    }

    // Create user pool client
    const userPoolClient = new cognito.UserPoolClient(
      this,
      `${stackNamePrefix}-UserPoolClient`,
      {
        authFlows: { userPassword: true },
        userPool
      }
    );

    // VPC
    const vpc = new ec2.Vpc(this, `${stackNamePrefix}-VPC`);

    // ECS CLUSTER
    const cluster = new ecs.Cluster(this, `${stackNamePrefix}-Cluster`, {
      clusterName: `${stackNamePrefix}-Cluster`,
      vpc
    });

    // TASK EXECUTION IAM ROLE
    const ecsTaskExecutionRole = new iam.Role(this, `${stackNamePrefix}-Role`, {
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
        'ivs:StopStream',
        'ivs:StopStream'
      ],
      effect: iam.Effect.ALLOW,
      resources: ['*']
    });
    const deleteUserPolicyStatement = new iam.PolicyStatement({
      actions: [
        'cognito-idp:AdminDeleteUser',
        'cognito-idp:AdminDisableUser',
        'cognito-idp:AdminGetUser'
      ],
      effect: iam.Effect.ALLOW,
      resources: [userPool.userPoolArn]
    });
    ecsTaskExecutionRole.addToPolicy(forgotPasswordPolicyStatement);
    ecsTaskExecutionRole.addToPolicy(ivsPolicyStatement);
    ecsTaskExecutionRole.addToPolicy(deleteUserPolicyStatement);

    // FARGATE TASK DEFINITION
    const fargateTaskDefinition = new ecs.FargateTaskDefinition(
      this,
      `${stackNamePrefix}-Cluster-TaskDefinition`,
      {
        cpu: 1024,
        memoryLimitMiB: 2048,
        taskRole: ecsTaskExecutionRole
      }
    );

    // CLOUDWATCH LOG GROUP
    const logGroup = new logs.LogGroup(this, `${stackNamePrefix}-LogGroup`, {
      removalPolicy: RemovalPolicy.DESTROY
    });

    // CONTAINER
    const container = fargateTaskDefinition.addContainer(
      `${stackNamePrefix}-Container`,
      {
        environment: {
          ALLOWED_ORIGIN: allowedOrigin,
          IVS_CHANNEL_TYPE: ivsChannelType,
          USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
          USER_POOL_ID: userPool.userPoolId,
          USER_TABLE_NAME: userTable.tableName
        },
        image: ecs.ContainerImage.fromAsset(path.join(__dirname, '../api')),
        logging: new ecs.AwsLogDriver({
          logGroup,
          streamPrefix: stackNamePrefix
        }),
        healthCheck: {
          command: [
            'CMD-SHELL',
            'curl -f http://localhost:8080/status || exit 1'
          ],
          retries: 5,
          startPeriod: Duration.seconds(5)
        }
      }
    );
    container.addPortMappings({ containerPort: 8080 });

    // FARGATE SERVICE
    const service = new ecs.FargateService(this, `${stackNamePrefix}-Service`, {
      cluster,
      serviceName: 'user',
      taskDefinition: fargateTaskDefinition
    });
    const scaling = service.autoScaleTaskCount({ maxCapacity: 30 });
    scaling.scaleOnCpuUtilization('CpuScaling', {
      scaleInCooldown: Duration.seconds(60),
      scaleOutCooldown: Duration.seconds(60),
      targetUtilizationPercent: 50
    });

    // LOAD BALANCER
    const loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      `${stackNamePrefix}-ApplicationLoadBalancer`,
      {
        internetFacing: true,
        loadBalancerName: 'user-management-api',
        vpc
      }
    );
    const listener = loadBalancer.addListener(`${stackNamePrefix}-Listener`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP
    });

    listener.addTargets('target', {
      healthCheck: { path: '/status' },
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetGroupName: 'user-management-api',
      targets: [service]
    });

    // Cloudfront distribution
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
    new CfnOutput(this, 'userManagementApiBaseUrl', {
      value: `https://${distribution.domainName}`
    });
    new CfnOutput(this, 'userPoolId', {
      value: userPool.userPoolId
    });
    new CfnOutput(this, 'userPoolClientId', {
      value: userPoolClient.userPoolClientId
    });
  }
}
