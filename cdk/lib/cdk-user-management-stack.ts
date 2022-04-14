import {
  aws_apigateway as apiGateway,
  aws_cognito as cognito,
  aws_dynamodb as dynamodb,
  aws_iam as iam,
  aws_lambda_nodejs as lambda,
  aws_logs as logs,
  CfnOutput,
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
  passwordResetClientBaseUrl: string;
  enableUserAutoVerify: boolean;
  ivsChannelType: ChannelType;
  logRetention?: logs.RetentionDays;
  stageName: 'dev' | 'prod';
}

export class UserManagementStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: StackProps,
    resourceConfig: ResourceConfig
  ) {
    super(scope, id, props);

    // Configuration variables based on the stage (dev or prod)
    const {
      allowedOrigin,
      passwordResetClientBaseUrl,
      enableUserAutoVerify,
      ivsChannelType,
      logRetention,
      stageName
    } = resourceConfig;

    // Default lambda parameters
    const defaultLambdaParams = {
      ...(logRetention ? { logRetention } : {}),
      bundling: { minify: true }
    };

    /**
     * Dynamo DB User Table
     */

    const userTable = new dynamodb.Table(this, 'UserTable', {
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
    const preSignUpLambda = new lambda.NodejsFunction(this, 'PreSignUpLambda', {
      ...defaultLambdaParams,
      entry: getLambdaEntryPath('cognitoTriggers/preSignUp'),
      environment: {
        ENABLE_USER_AUTO_VERIFY: `${enableUserAutoVerify}`,
        USER_TABLE_NAME: userTable.tableName
      }
    });

    // Required permissions to check for email uniqueness
    userTable.grantReadData(preSignUpLambda);

    // Lambda to create resources for newly confirmed users
    const postConfirmationLambda = new lambda.NodejsFunction(
      this,
      'PostConfirmationLambda',
      {
        ...defaultLambdaParams,
        entry: getLambdaEntryPath('cognitoTriggers/postConfirmation'),
        environment: {
          IVS_CHANNEL_TYPE: ivsChannelType,
          USER_TABLE_NAME: userTable.tableName
        }
      }
    );
    const createIvsChannelPolicyStatement = new iam.PolicyStatement({
      actions: ['ivs:CreateChannel'],
      effect: iam.Effect.ALLOW,
      resources: ['*']
    });

    postConfirmationLambda.addToRolePolicy(createIvsChannelPolicyStatement);
    userTable.grantWriteData(postConfirmationLambda);

    // Lambda to auto verify new users, not suitable for production
    const customMessageLambda = new lambda.NodejsFunction(
      this,
      'CustomMessageLambda',
      {
        ...defaultLambdaParams,
        entry: getLambdaEntryPath('cognitoTriggers/customMessage'),
        environment: {
          PASSWORD_RESET_CLIENT_BASE_URL: passwordResetClientBaseUrl
        }
      }
    );

    /**
     * Cognito User Pool
     */

    // Create user pool
    const userPool = new cognito.UserPool(this, 'UserPool', {
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
        customMessage: customMessageLambda,
        postConfirmation: postConfirmationLambda,
        preSignUp: preSignUpLambda
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
    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      authFlows: { userPassword: true },
      userPool
    });

    /**
     * API Gateway
     */

    // Lambda to get user data
    const getUserLambdaId = 'GetUserLambda';
    const getUserLambda = new lambda.NodejsFunction(this, getUserLambdaId, {
      ...defaultLambdaParams,
      entry: getLambdaEntryPath('getUser'),
      environment: {
        ALLOWED_ORIGIN: allowedOrigin,
        USER_TABLE_NAME: userTable.tableName
      }
    });

    userTable.grantReadData(getUserLambda);

    // Lambda to reset a user's stream key
    const resetStreamKeyLambdaId = 'ResetStreamKeyLambda';
    const resetStreamKeyLambda = new lambda.NodejsFunction(
      this,
      resetStreamKeyLambdaId,
      {
        ...defaultLambdaParams,
        entry: getLambdaEntryPath('resetStreamKey'),
        environment: {
          ALLOWED_ORIGIN: allowedOrigin,
          USER_TABLE_NAME: userTable.tableName
        }
      }
    );
    const resetStreamKeyPolicyStatement = new iam.PolicyStatement({
      actions: ['ivs:StopStream', 'ivs:CreateStreamKey', 'ivs:DeleteStreamKey'],
      effect: iam.Effect.ALLOW,
      resources: ['*']
    });

    resetStreamKeyLambda.addToRolePolicy(resetStreamKeyPolicyStatement);
    userTable.grantReadWriteData(resetStreamKeyLambda);

    // Lambda to delete a user account and its associated resources
    const deleteUserLambdaId = 'DeleteUserLambda';
    const deleteUserLambda = new lambda.NodejsFunction(
      this,
      deleteUserLambdaId,
      {
        ...defaultLambdaParams,
        entry: getLambdaEntryPath('deleteUser'),
        environment: {
          ALLOWED_ORIGIN: allowedOrigin,
          USER_TABLE_NAME: userTable.tableName,
          USER_POOL_ID: userPool.userPoolId
        }
      }
    );
    const deleteIvsChannelPolicyStatement = new iam.PolicyStatement({
      actions: ['ivs:StopStream', 'ivs:DeleteChannel'],
      effect: iam.Effect.ALLOW,
      resources: ['*']
    });
    const deleteUserPolicyStatement = new iam.PolicyStatement({
      actions: ['cognito-idp:AdminDeleteUser', 'cognito-idp:AdminDisableUser'],
      effect: iam.Effect.ALLOW,
      resources: [userPool.userPoolArn]
    });

    deleteUserLambda.addToRolePolicy(deleteIvsChannelPolicyStatement);
    deleteUserLambda.addToRolePolicy(deleteUserPolicyStatement);
    userTable.grantReadWriteData(deleteUserLambda);

    // Lambda to authorize requests to the API Gateway
    const authorizerLambda = new lambda.NodejsFunction(
      this,
      'AuthorizerLambda',
      {
        ...defaultLambdaParams,
        entry: getLambdaEntryPath('authorizer'),
        environment: {
          USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
          USER_POOL_ID: userPool.userPoolId
        }
      }
    );

    const createJwtAuthorizerProps = (lambdaName: string) => ({
      authorizer: new apiGateway.TokenAuthorizer(
        this,
        `JwtAuthorizer${lambdaName}`,
        { handler: authorizerLambda }
      ),
      authorizationType: apiGateway.AuthorizationType.CUSTOM
    });

    // Lambda to reset user password
    const forgotPasswordLambda = new lambda.NodejsFunction(
      this,
      'ForgotPasswordLambda',
      {
        ...defaultLambdaParams,
        entry: getLambdaEntryPath('forgotPassword'),
        environment: {
          ALLOWED_ORIGIN: allowedOrigin,
          USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
          USER_TABLE_NAME: userTable.tableName
        }
      }
    );
    const forgotPasswordPolicyStatement = new iam.PolicyStatement({
      actions: ['cognito-idp:ForgotPassword'],
      effect: iam.Effect.ALLOW,
      resources: [userPool.userPoolArn]
    });

    forgotPasswordLambda.addToRolePolicy(forgotPasswordPolicyStatement);
    userTable.grantReadData(forgotPasswordLambda);

    // Create the API Gateway
    const userManagementApiGateway = new apiGateway.RestApi(
      this,
      'UserManagementApiGateway',
      { deployOptions: { stageName } }
    );

    // Add resources
    const userResource = userManagementApiGateway.root.addResource('user');

    // Add the GET /user endpoint
    userResource.addMethod(
      'GET',
      new apiGateway.LambdaIntegration(getUserLambda),
      { ...createJwtAuthorizerProps(getUserLambdaId) }
    );

    // Add the DELETE /user endpoint
    userResource.addMethod(
      'DELETE',
      new apiGateway.LambdaIntegration(deleteUserLambda),
      { ...createJwtAuthorizerProps(deleteUserLambdaId) }
    );

    // Add the POST /user/reset endpoint
    userResource
      .addResource('reset')
      .addMethod(
        'POST',
        new apiGateway.LambdaIntegration(forgotPasswordLambda)
      );

    // Add the GET /user/streamKey/reset endpoint
    userResource
      .addResource('streamKey')
      .addResource('reset')
      .addMethod(
        'GET',
        new apiGateway.LambdaIntegration(resetStreamKeyLambda),
        { ...createJwtAuthorizerProps(resetStreamKeyLambdaId) }
      );

    /**
     * Stack Outputs
     */

    new CfnOutput(this, 'userPoolId', {
      value: userPool.userPoolId
    });
    new CfnOutput(this, 'userPoolClientId', {
      value: userPoolClient.userPoolClientId
    });
    new CfnOutput(this, 'userManagementApiGatewayEndpoint', {
      value: userManagementApiGateway.url
    });
  }
}
