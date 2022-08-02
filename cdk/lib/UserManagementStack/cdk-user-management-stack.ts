import {
  aws_cognito as cognito,
  aws_dynamodb as dynamodb,
  aws_iam as iam,
  NestedStack,
  NestedStackProps,
  RemovalPolicy
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { UserManagementResourceConfig } from '../constants';
import UserManagementCognitoTriggers from './Constructs/UserManagementCognitoTriggers';

interface UserManagementStackProps extends NestedStackProps {
  resourceConfig: UserManagementResourceConfig;
}

export class UserManagementStack extends NestedStack {
  public readonly containerEnv: { [key: string]: string };
  public readonly outputs: {
    userPoolClientId: string;
    userPoolId: string;
    userTable: dynamodb.Table;
  };
  public readonly policies: iam.PolicyStatement[];

  constructor(scope: Construct, id: string, props: UserManagementStackProps) {
    super(scope, id, props);

    const stackNamePrefix = 'UserManagement';
    const { resourceConfig } = props;

    // Configuration variables based on the stage (dev or prod)
    const { enableUserAutoVerify, ivsChannelType } = resourceConfig;

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
    userTable.addGlobalSecondaryIndex({
      indexName: 'channelArnIndex',
      partitionKey: { name: 'channelArn', type: dynamodb.AttributeType.STRING }
    });
    userTable.addGlobalSecondaryIndex({
      indexName: 'usernameIndex',
      partitionKey: { name: 'username', type: dynamodb.AttributeType.STRING }
    });

    // Cognito Lambda triggers
    const { customMessageLambda, preAuthenticationLambda, preSignUpLambda } =
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
        customMessage: customMessageLambda,
        preAuthentication: preAuthenticationLambda
      },
      removalPolicy: RemovalPolicy.DESTROY,
      selfSignUpEnabled: true,
      signInAliases: { preferredUsername: true, username: true },
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
      `${stackNamePrefix}-UserPoolClient`,
      {
        authFlows: { userPassword: true },
        userPool
      }
    );

    // IAM Policies
    const policies = [];
    const userTablePolicyStatement = new iam.PolicyStatement({
      actions: [
        'dynamodb:Query',
        'dynamodb:GetItem',
        'dynamodb:PutItem',
        'dynamodb:UpdateItem',
        'dynamodb:DeleteItem'
      ],
      effect: iam.Effect.ALLOW,
      resources: [
        userTable.tableArn,
        `${userTable.tableArn}/index/emailIndex`,
        `${userTable.tableArn}/index/usernameIndex`
      ]
    });
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
    const ivsChatPolicyStatement = new iam.PolicyStatement({
      actions: [
        'ivschat:CreateChatToken',
        'ivschat:CreateRoom',
        'ivschat:DeleteMessage',
        'ivschat:DisconnectUser',
        'ivschat:SendEvent'
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
      userTablePolicyStatement,
      forgotPasswordPolicyStatement,
      ivsPolicyStatement,
      ivsChatPolicyStatement,
      deleteUserPolicyStatement
    );
    this.policies = policies;

    const containerEnv = {
      IVS_CHANNEL_TYPE: ivsChannelType,
      USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      USER_POOL_ID: userPool.userPoolId,
      USER_TABLE_NAME: userTable.tableName
    };
    this.containerEnv = containerEnv;

    // Stack Outputs
    this.outputs = {
      userPoolClientId: userPoolClient.userPoolClientId,
      userPoolId: userPool.userPoolId,
      userTable
    };
  }
}
