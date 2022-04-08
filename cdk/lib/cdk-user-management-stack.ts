import {
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

    const { enableUserAutoVerify, ivsChannelType, logRetention } =
      resourceConfig;

    /**
     * Dynamo DB
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
     * Cognito
     */

    // Lambda to auto verify new users, not suitable for production
    const preSignUpLambda = new lambda.NodejsFunction(this, 'PreSignUpLambda', {
      ...(logRetention ? { logRetention } : {}),
      bundling: { minify: true },
      entry: getLambdaEntryPath('preSignUp'),
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
        ...(logRetention ? { logRetention } : {}),
        bundling: { minify: true },
        entry: getLambdaEntryPath('postConfirmation'),
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

    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      authFlows: { userPassword: true },
      userPool
    });

    /**
     * Stack Outputs
     */
    new CfnOutput(this, 'userPoolId', {
      value: userPool.userPoolId
    });
    new CfnOutput(this, 'userPoolClientId', {
      value: userPoolClient.userPoolClientId
    });
  }
}
