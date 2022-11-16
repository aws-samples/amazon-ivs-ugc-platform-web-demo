import {
  aws_cognito as cognito,
  aws_dynamodb as dynamodb,
  aws_iam as iam,
  NestedStack,
  NestedStackProps,
  RemovalPolicy
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { ChannelsResourceConfig } from '../constants';
import ChannelsCognitoTriggers from './Constructs/ChannelsCognitoTriggers';

interface ChannelsStackProps extends NestedStackProps {
  resourceConfig: ChannelsResourceConfig;
  tags: { [key: string]: string };
}

export class ChannelsStack extends NestedStack {
  public readonly containerEnv: { [key: string]: string };
  public readonly outputs: {
    userPoolClientId: string;
    userPoolId: string;
    channelsTable: dynamodb.Table;
  };
  public readonly policies: iam.PolicyStatement[];

  constructor(scope: Construct, id: string, props: ChannelsStackProps) {
    super(scope, id, props);

    const stackNamePrefix = 'Channels';
    const { resourceConfig, tags } = props;

    // Configuration variables based on the stage (dev or prod)
    const { enableUserAutoVerify, ivsChannelType, signUpAllowedDomains } =
      resourceConfig;

    // Dynamo DB Channels Table
    const channelsTable = new dynamodb.Table(
      this,
      `${stackNamePrefix}-ChannelsTable`,
      {
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
        removalPolicy: RemovalPolicy.DESTROY
      }
    );

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

    // Cognito Lambda triggers
    const { customMessageLambda, preAuthenticationLambda, preSignUpLambda } =
      new ChannelsCognitoTriggers(
        this,
        `${stackNamePrefix}-ChannelsCognitoTriggers`,
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
        actions: ['dynamodb:Scan'],
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
        'ivs:CreateStreamKey',
        'ivs:DeleteChannel',
        'ivs:DeleteStreamKey',
        'ivs:StopStream',
        'ivs:PutMetadata',
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
      channelsTablePolicyStatement,
      channelsTableChannelArnIndexPolicyStatement,
      forgotPasswordPolicyStatement,
      ivsPolicyStatement,
      ivsChatPolicyStatement,
      deleteUserPolicyStatement
    );
    this.policies = policies;

    const containerEnv = {
      SIGN_UP_ALLOWED_DOMAINS: JSON.stringify(signUpAllowedDomains),
      IVS_CHANNEL_TYPE: ivsChannelType,
      USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      USER_POOL_ID: userPool.userPoolId,
      CHANNELS_TABLE_NAME: channelsTable.tableName,
      PROJECT_TAG: tags.project
    };
    this.containerEnv = containerEnv;

    // Stack Outputs
    this.outputs = {
      userPoolClientId: userPoolClient.userPoolClientId,
      userPoolId: userPool.userPoolId,
      channelsTable
    };
  }
}
