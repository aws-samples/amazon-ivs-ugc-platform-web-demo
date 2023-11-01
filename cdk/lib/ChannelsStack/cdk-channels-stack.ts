import {
  aws_appsync as appsync,
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as origins,
  aws_cognito as cognito,
  aws_dynamodb as dynamodb,
  aws_events as events,
  aws_events_targets as targets,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_lambda_nodejs as nodejsLambda,
  aws_s3 as s3,
  aws_s3_notifications as s3n,
  Duration,
  NestedStack,
  NestedStackProps,
  RemovalPolicy,
  Stack,
  SecretValue
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ProjectionType } from 'aws-cdk-lib/aws-dynamodb';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { readFileSync } from 'fs'

import {
  ALLOWED_CHANNEL_ASSET_TYPES,
  ChannelsResourceConfig
} from '../constants';
import ChannelsCognitoTriggers from './Constructs/ChannelsCognitoTriggers';
import SQSLambdaTrigger from '../Constructs/SQSLambdaTrigger';
import { SECRET_IDS } from '../../api/shared/constants';
import { join } from 'path';

const getLambdaEntryPath = (functionName: string) =>
  join(__dirname, '../../lambdas', `${functionName}.ts`);

interface ChannelsStackProps extends NestedStackProps {
  resourceConfig: ChannelsResourceConfig;
  tags: { [key: string]: string };
  cognitoCleanupScheduleExp: string;
  stageCleanupScheduleExp: string;
}

export class ChannelsStack extends NestedStack {
  public readonly containerEnv: { [key: string]: string };
  public readonly outputs: {
    userPoolClientId: string;
    userPoolId: string;
    channelsTable: dynamodb.Table;
    productApiSecretName: string;
    appSyncGraphQlApi: {
      apiKey: string;
      endpoint: string;
      authType: string;
    };
  };
  public readonly policies: iam.PolicyStatement[];

  constructor(scope: Construct, id: string, props: ChannelsStackProps) {
    super(scope, id, props);

    const parentStackName = Stack.of(this.nestedStackParent!).stackName;
    const nestedStackName = 'Channels';
    const stackNamePrefix = `${parentStackName}-${nestedStackName}`;
    const {
      resourceConfig,
      cognitoCleanupScheduleExp,
      stageCleanupScheduleExp,
      tags
    } = props;

    // Configuration variables based on the stage (dev or prod)
    const {
      allowedOrigins,
      enableUserAutoVerify,
      ivsAdvancedChannelTranscodePreset,
      ivsChannelType,
      signUpAllowedDomains
    } = resourceConfig;

    // Cognito Lambda triggers
    const { customMessageLambda, preAuthenticationLambda, preSignUpLambda } =
      new ChannelsCognitoTriggers(
        this,
        `${nestedStackName}-ChannelsCognitoTriggers`,
        { ...resourceConfig }
      );

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, `${nestedStackName}-UserPool`, {
      ...(!enableUserAutoVerify
        ? {
            // autoVerify is used to set the attribute that Cognito will use to verify users, but will not actually verify the email automatically (the user will still need to verify it upon sign-up)
            autoVerify: { email: true }
          }
        : {}),
      lambdaTriggers: {
        ...(enableUserAutoVerify ? { preSignUp: preSignUpLambda } : {}),
        customMessage: customMessageLambda,
        preAuthentication: preAuthenticationLambda
      },
      removalPolicy: RemovalPolicy.DESTROY,
      selfSignUpEnabled: true,
      signInAliases: { preferredUsername: true, username: true, email: true },
      signInCaseSensitive: false,
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
      `${nestedStackName}-UserPoolClient`,
      {
        authFlows: { userPassword: true },
        userPool
      }
    );

    // Dynamo DB Channels Table
    const channelsTable = new dynamodb.Table(this, `${nestedStackName}-Table`, {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY
    });

    channelsTable.addGlobalSecondaryIndex({
      indexName: 'emailIndex',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING }
    });
    channelsTable.addGlobalSecondaryIndex({
      indexName: 'channelArnIndex',
      partitionKey: { name: 'channelArn', type: dynamodb.AttributeType.STRING }
    });
    channelsTable.addGlobalSecondaryIndex({
      indexName: 'usernameIndex',
      partitionKey: { name: 'username', type: dynamodb.AttributeType.STRING }
    });
    channelsTable.addGlobalSecondaryIndex({
      indexName: 'channelAssetIdIndex',
      partitionKey: {
        name: 'channelAssetId',
        type: dynamodb.AttributeType.STRING
      },
      projectionType: ProjectionType.INCLUDE,
      nonKeyAttributes: ['channelAssets']
    });

    // S3 Channel Assets Bucket
    const channelAssetsBucket = new s3.Bucket(
      this,
      `${nestedStackName}-ChannelAssets-Bucket`,
      {
        removalPolicy: RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        versioned: true,
        lifecycleRules: [
          {
            expiredObjectDeleteMarker: true,
            noncurrentVersionExpiration: Duration.days(1)
          }
        ],
        blockPublicAccess: new s3.BlockPublicAccess({
          blockPublicAcls: true,
          ignorePublicAcls: true,
          blockPublicPolicy: true,
          restrictPublicBuckets: true
        }),
        cors: [
          {
            allowedOrigins,
            allowedHeaders: ['*'],
            allowedMethods: [
              s3.HttpMethods.GET,
              s3.HttpMethods.PUT,
              s3.HttpMethods.POST
            ],
            exposedHeaders: ['Location', 'x-amz-version-id', 'Date']
          }
        ],
        objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED
      }
    );

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      `${nestedStackName}-cloudfrontOriginAccessIdentity`,
      {
        comment:
          'This OAI is used to allow cloudfront to get objects from the channel assets bucket'
      }
    );

    const cloudfrontPolicyStatementForS3 = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetObject', 's3:GetObjectVersion'],
      resources: [`${channelAssetsBucket.bucketArn}/*`],
      principals: [
        new iam.CanonicalUserPrincipal(
          originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId
        )
      ]
    });

    channelAssetsBucket.addToResourcePolicy(cloudfrontPolicyStatementForS3);

    // Channel Assets Distribution
    const {
      AllowedMethods,
      CachedMethods,
      CachePolicy,
      CacheQueryStringBehavior,
      Distribution,
      OriginRequestPolicy,
      ResponseHeadersPolicy,
      ViewerProtocolPolicy
    } = cloudfront;
    const defaultBehavior = {
      origin: new origins.S3Origin(channelAssetsBucket, {
        originAccessIdentity
      }),
      allowedMethods: AllowedMethods.ALLOW_ALL,
      cachedMethods: CachedMethods.CACHE_GET_HEAD,
      originRequestPolicy: OriginRequestPolicy.CORS_S3_ORIGIN,
      responseHeadersPolicy: ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS
    };
    const versionIdQueryStringCachePolicy = new CachePolicy(
      this,
      `${nestedStackName}-VersionId-QueryStringCacheBehavior-CachePolicy`,
      {
        comment: 'Only includes the versionId queryString in the cache key',
        queryStringBehavior: CacheQueryStringBehavior.allowList('versionId')
      }
    );
    const additionalBehaviors = ALLOWED_CHANNEL_ASSET_TYPES.map(
      (assetType) => `/*/${assetType}`
    ).reduce(
      (behaviors, pathPattern) => ({
        ...behaviors,
        [pathPattern]: {
          ...defaultBehavior,
          cachePolicy: versionIdQueryStringCachePolicy
        }
      }),
      {}
    );
    const channelAssetsDistribution = new Distribution(
      this,
      `${nestedStackName}-ChannelAssets-Distribution`,
      { defaultBehavior, additionalBehaviors }
    );
    const channelAssetsDistributionURL = `https://${channelAssetsDistribution.domainName}`;

    const { srcQueue: channelAssetsUpdateVersionIdQueue } =
      new SQSLambdaTrigger(
        this,
        `${nestedStackName}-ChannelAssets-UpdateVersionId-SQSLambdaTrigger`,
        {
          name: `${stackNamePrefix}-ChnlAssetsUpdateVersionId`,
          srcHandler: {
            entryFunctionName: 'updateVersionId',
            description:
              'Triggered by Amazon SQS when new S3 event messages arrive in the queue to update channel asset versionIds',
            environment: {
              CHANNEL_ASSETS_BASE_URL: channelAssetsDistributionURL,
              CHANNELS_TABLE_NAME: channelsTable.tableName
            },
            initialPolicy: [
              new iam.PolicyStatement({
                actions: ['dynamodb:Query'],
                effect: iam.Effect.ALLOW,
                resources: [
                  `${channelsTable.tableArn}/index/channelAssetIdIndex`
                ]
              }),
              new iam.PolicyStatement({
                actions: ['dynamodb:UpdateItem'],
                effect: iam.Effect.ALLOW,
                resources: [channelsTable.tableArn]
              })
            ]
          },
          dlqHandler: {
            entryFunctionName: 'updateVersionIdDlq',
            description:
              'Triggered by an Amazon SQS DLQ to handle S3 event message consumption failures when updating the channel asset versionIds, and to manage the life cycle of unconsumed messages'
          }
        }
      );

    // Add an S3 Event Notification that publishes an s3:ObjectCreated:* event to the SQS
    // channelAssetsUpdateVersionIdQueue for object keys matching the ALLOWED_CHANNEL_ASSET_TYPES suffixes
    ALLOWED_CHANNEL_ASSET_TYPES.forEach((suffix) => {
      channelAssetsBucket.addEventNotification(
        s3.EventType.OBJECT_CREATED,
        new s3n.SqsDestination(channelAssetsUpdateVersionIdQueue),
        { suffix }
      );
    });

    // IAM Policies
    const policies = [];
    const channelAssetsObjectPolicyStatement = new iam.PolicyStatement({
      actions: ['s3:PutObject', 's3:DeleteObject', 's3:DeleteObjects'],
      effect: iam.Effect.ALLOW,
      resources: ALLOWED_CHANNEL_ASSET_TYPES.map(
        (assetType) => `${channelAssetsBucket.bucketArn}/*/${assetType}`
      )
    });
    const secretsManagerPolicyStatement = new iam.PolicyStatement({
      actions: ['secretsmanager:GetSecretValue'],
      effect: iam.Effect.ALLOW,
      resources: ['*']
    });
    const channelAssetsBucketPolicyStatement = new iam.PolicyStatement({
      actions: ['s3:ListBucket'],
      effect: iam.Effect.ALLOW,
      resources: [channelAssetsBucket.bucketArn]
    });
    const channelsTablePolicyStatement = new iam.PolicyStatement({
      actions: [
        'dynamodb:Query',
        'dynamodb:GetItem',
        'dynamodb:PutItem',
        'dynamodb:UpdateItem',
        'dynamodb:DeleteItem'
      ],
      effect: iam.Effect.ALLOW,
      resources: [
        channelsTable.tableArn,
        `${channelsTable.tableArn}/index/emailIndex`,
        `${channelsTable.tableArn}/index/usernameIndex`
      ]
    });
    const channelsTableChannelArnIndexPolicyStatement = new iam.PolicyStatement(
      {
        actions: ['dynamodb:Query'],
        effect: iam.Effect.ALLOW,
        resources: [
          channelsTable.tableArn,
          `${channelsTable.tableArn}/index/channelArnIndex`
        ]
      }
    );
    const forgotPasswordPolicyStatement = new iam.PolicyStatement({
      actions: ['cognito-idp:ForgotPassword'],
      effect: iam.Effect.ALLOW,
      resources: [userPool.userPoolArn]
    });
    const ivsPolicyStatement = new iam.PolicyStatement({
      actions: [
        'ivs:CreateChannel',
        'ivs:CreateParticipantToken',
        'ivs:CreateStage',
        'ivs:ListParticipants',
        'ivs:DisconnectParticipant',
        'ivs:CreateStreamKey',
        'ivs:DeleteChannel',
        'ivs:DeleteStage',
        'ivs:DeleteStreamKey',
        'ivs:GetStage',
        'ivs:PutMetadata',
        'ivs:StopStream',
        'ivs:TagResource'
      ],
      effect: iam.Effect.ALLOW,
      resources: ['*']
    });
    const ivsChatPolicyStatement = new iam.PolicyStatement({
      actions: [
        'ivschat:CreateChatToken',
        'ivschat:CreateRoom',
        'ivschat:DeleteMessage',
        'ivschat:DeleteRoom',
        'ivschat:DisconnectUser',
        'ivschat:SendEvent',
        'ivschat:TagResource'
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
    policies.push(
      channelAssetsBucketPolicyStatement,
      channelAssetsObjectPolicyStatement,
      channelsTableChannelArnIndexPolicyStatement,
      channelsTablePolicyStatement,
      deleteUserPolicyStatement,
      forgotPasswordPolicyStatement,
      ivsChatPolicyStatement,
      ivsPolicyStatement,
      secretsManagerPolicyStatement
    );
    this.policies = policies;

    // Cleanup idle stages users policies
    const deleteIdleStagesIvsPolicyStatement = new iam.PolicyStatement({
      actions: ['ivs:ListStages', 'ivs:DeleteStage'],
      effect: iam.Effect.ALLOW,
      resources: ['*']
    });

    // Cleanup unverified users policies
    const deleteUnverifiedChannelsPolicyStatement = new iam.PolicyStatement({
      actions: ['dynamodb:BatchWriteItem'],
      effect: iam.Effect.ALLOW,
      resources: [channelsTable.tableArn]
    });
    const deleteUnverifiedUserPolicyStatement = new iam.PolicyStatement({
      actions: ['cognito-idp:AdminDeleteUser', 'cognito-idp:ListUsers'],
      effect: iam.Effect.ALLOW,
      resources: [userPool.userPoolArn]
    });

    // Cleanup idle stages lambda
    const cleanupIdleStagesHandler = new nodejsLambda.NodejsFunction(
      this,
      `${stackNamePrefix}-CleanupIdleStages-Handler`,
      {
        logRetention: 7,
        runtime: lambda.Runtime.NODEJS_16_X,
        bundling: { minify: true },
        functionName: `${stackNamePrefix}-CleanupIdleStages`,
        entry: getLambdaEntryPath('cleanupIdleStages'),
        timeout: Duration.minutes(10),
        initialPolicy: [deleteIdleStagesIvsPolicyStatement]
      }
    );

    // Cleanup unverified users lambda
    const cleanupUnverifiedUsersHandler = new nodejsLambda.NodejsFunction(
      this,
      `${stackNamePrefix}-CleanupUnverifiedUsers-Handler`,
      {
        logRetention: 7,
        runtime: lambda.Runtime.NODEJS_16_X,
        bundling: { minify: true },
        functionName: `${stackNamePrefix}-CleanupUnverifiedUsers`,
        entry: getLambdaEntryPath('cleanupUnverifiedUsers'),
        timeout: Duration.minutes(10),
        initialPolicy: [
          deleteUnverifiedUserPolicyStatement,
          deleteUnverifiedChannelsPolicyStatement
        ]
      }
    );

    // Scheduled cleanup idle stages lambda function
    new events.Rule(this, 'Cleanup-Idle-Stages-Schedule-Rule', {
      schedule: events.Schedule.expression(stageCleanupScheduleExp),
      ruleName: `${stackNamePrefix}-CleanupIdleStages-Schedule`,
      targets: [
        new targets.LambdaFunction(cleanupIdleStagesHandler, {
          maxEventAge: Duration.minutes(2),
          retryAttempts: 2
        })
      ]
    });

    // Scheduled cleanup unverified users lambda function
    new events.Rule(this, 'Cleanup-Unverified-Users-Schedule-Rule', {
      schedule: events.Schedule.expression(cognitoCleanupScheduleExp),
      ruleName: `${stackNamePrefix}-CleanupUnverifiedUsers-Schedule`,
      targets: [
        new targets.LambdaFunction(cleanupUnverifiedUsersHandler, {
          maxEventAge: Duration.minutes(2),
          retryAttempts: 2
        })
      ]
    });

    const containerEnv = {
      CHANNEL_ASSETS_BUCKET_NAME: channelAssetsBucket.bucketName,
      CHANNELS_TABLE_NAME: channelsTable.tableName,
      IVS_CHANNEL_TYPE: ivsChannelType,
      IVS_ADVANCED_CHANNEL_TRANSCODE_PRESET: ivsAdvancedChannelTranscodePreset,
      PROJECT_TAG: tags.project,
      SIGN_UP_ALLOWED_DOMAINS: JSON.stringify(signUpAllowedDomains),
      USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      USER_POOL_ID: userPool.userPoolId
    };
    this.containerEnv = containerEnv;

    // Add secrets to the AWS Secrets Manager
    const productApiSecret = new Secret(this, SECRET_IDS.PA_API, {
      description:
        'Required JSON object containing the secretKey, accessKey and partnerTag for PA API Credentials',
      secretObjectValue: {
        secretKey: SecretValue.unsafePlainText(''),
        accessKey: SecretValue.unsafePlainText(''),
        partnerTag: SecretValue.unsafePlainText('')
      }
    });

    // Create AppSync GraphQL API
    const authType = 'API_KEY'

    const api = new appsync.CfnGraphQLApi(this, `${stackNamePrefix}-AppSyncGraphQLChannelApi`, {
      name: 'ChannelGraphQLApi',
      authenticationType: authType
    })

    const noneDataSource = new appsync.CfnDataSource(this, `${stackNamePrefix}-AppSyncGraphQLNoneDataSource`, {
      apiId: api.attrApiId,
      name: 'NoneDataSourceName',
      type: 'NONE',
    });

    const schema = new appsync.CfnGraphQLSchema(this, `${stackNamePrefix}-AppSyncGraphQLChannelAPISchema`, {
      apiId: api.attrApiId,
      definition: readFileSync('./lib/ChannelsStack/schema.graphql').toString(),
    });

    const resolver = new appsync.CfnResolver(this, `${stackNamePrefix}-AppSyncGraphQLPublishMutationResolver`, {
      apiId: api.attrApiId,
      typeName: 'Mutation',
      fieldName: 'publish',
      dataSourceName: noneDataSource.name,
      requestMappingTemplate: `{
        "version": "2017-02-28",
        "payload": {
          "name": "$context.arguments.name",
          "data": $util.toJson($context.arguments.data)
        }
      }`,
      responseMappingTemplate: `$util.toJson($context.result)`,
    });

    resolver.addDependsOn(schema)
    resolver.addDependsOn(noneDataSource)

    const apiKey = new appsync.CfnApiKey(this, `${stackNamePrefix}-AppSyncGraphQLApiKey`, {
      apiId: api.attrApiId,
    });

    const appSyncGraphQlApi = {
      apiKey: apiKey.attrApiKey,
      endpoint: api.attrGraphQlUrl,
      authType
    }

    // Stack Outputs
    this.outputs = {
      userPoolClientId: userPoolClient.userPoolClientId,
      userPoolId: userPool.userPoolId,
      channelsTable,
      productApiSecretName: productApiSecret.secretName,
      appSyncGraphQlApi
    };
  }
}
