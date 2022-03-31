import { Construct } from 'constructs';
import {
  aws_apigateway as apiGateway,
  aws_cognito as cognito,
  aws_dynamodb as dynamodb,
  aws_iam as iam,
  aws_lambda_nodejs as lambda,
  Stack,
  StackProps,
  RemovalPolicy
} from 'aws-cdk-lib';
import { ChannelType } from '@aws-sdk/client-ivs';

import { getLambdaEntryPath } from './utils';

export interface ResourceConfig {
  allowOrigins: string[];
  enableUserAutoVerify: boolean;
  ivsChannelType: ChannelType;
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

    const { allowOrigins, enableUserAutoVerify, ivsChannelType, stageName } =
      resourceConfig;

    /**
     * Cognito
     */

    // Lambda to auto verify new users, not suitable for production
    const preSignUpLambda = new lambda.NodejsFunction(this, 'PreSignUpLambda', {
      bundling: { minify: true },
      entry: getLambdaEntryPath('preSignUp')
    });

    const userPool = new cognito.UserPool(this, 'UserPool', {
      ...(enableUserAutoVerify
        ? {
            lambdaTriggers: {
              preSignUp: preSignUpLambda
            }
          }
        : {}),
      removalPolicy: RemovalPolicy.DESTROY,
      selfSignUpEnabled: true,
      standardAttributes: { email: { mutable: true, required: true } }
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool
    });

    /**
     * Dynamo DB
     */

    const userTable = new dynamodb.Table(this, 'UserTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY
    });

    /**
     * API Gateway
     */

    // Lambda to register new users
    const registerUserLambda = new lambda.NodejsFunction(
      this,
      'RegisterUserLambda',
      {
        bundling: { minify: true },
        entry: getLambdaEntryPath('registerUser'),
        environment: {
          IVS_CHANNEL_TYPE: ivsChannelType,
          USER_TABLE_NAME: userTable.tableName,
          USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId
        }
      }
    );
    const createChannelPolicy = new iam.PolicyStatement({
      actions: ['ivs:CreateChannel'],
      effect: iam.Effect.ALLOW,
      resources: ['*']
    });

    registerUserLambda.addToRolePolicy(createChannelPolicy);
    userTable.grantWriteData(registerUserLambda);

    const userManagementApiGateway = new apiGateway.RestApi(
      this,
      'userManagementApiGateway',
      {
        // Enable CORS
        defaultCorsPreflightOptions: {
          allowOrigins,
          allowMethods: ['POST']
        },
        deployOptions: { stageName }
      }
    );

    // Add the POST /register endpoint
    userManagementApiGateway.root
      .addResource('register')
      .addMethod('POST', new apiGateway.LambdaIntegration(registerUserLambda));
  }
}
