import { Construct } from 'constructs';
import {
  aws_lambda_nodejs as lambda,
  aws_apigateway as apiGateway,
  aws_cognito as cognito,
  Stack,
  StackProps,
  RemovalPolicy
} from 'aws-cdk-lib';

import { getLambdaEntryPath } from './utils';

export interface ResourceConfig {
  allowOrigins: string[];
  enableUserAutoVerify: boolean;
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

    const { allowOrigins, enableUserAutoVerify, stageName } = resourceConfig;

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
          USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId
        }
      }
    );

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
