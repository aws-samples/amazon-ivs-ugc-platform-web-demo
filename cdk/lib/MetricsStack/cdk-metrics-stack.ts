import {
  aws_dynamodb as dynamodb,
  aws_ec2 as ec2,
  aws_elasticloadbalancingv2 as elbv2,
  aws_ecs as ecs,
  aws_events as events,
  aws_events_targets as eventsTargets,
  aws_apigateway as apigateway,
  aws_iam as iam,
  NestedStack,
  NestedStackProps,
  RemovalPolicy
} from 'aws-cdk-lib';
import { ChannelType } from '@aws-sdk/client-ivs';
import { Construct } from 'constructs';
import path from 'path';

import Service from '../Constructs/Service';

interface MetricsStackProps extends NestedStackProps {
  cluster: ecs.Cluster;
  ivsChannelType: ChannelType;
  userTable: dynamodb.Table;
  vpc: ec2.Vpc;
}

export class MetricsStack extends NestedStack {
  public readonly containerEnv: { [key: string]: string };
  public readonly policies: iam.PolicyStatement[];

  constructor(scope: Construct, id: string, props: MetricsStackProps) {
    super(scope, id, props);

    const stackNamePrefix = 'Metrics';
    const { cluster, ivsChannelType, userTable, vpc } = props;

    // Dynamo DB Stream Table
    const streamTable = new dynamodb.Table(
      this,
      `${stackNamePrefix}-StreamTable`,
      {
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        partitionKey: {
          name: 'channelArn',
          type: dynamodb.AttributeType.STRING
        },
        sortKey: { name: 'id', type: dynamodb.AttributeType.STRING },
        removalPolicy: RemovalPolicy.DESTROY
      }
    );

    // This is required to sort the results by startTime
    streamTable.addLocalSecondaryIndex({
      indexName: 'startTimeIndex',
      sortKey: { name: 'startTime', type: dynamodb.AttributeType.STRING }
    });

    // IAM Policies
    const policies = [];
    const streamTablePolicyStatement = new iam.PolicyStatement({
      actions: ['dynamodb:GetItem', 'dynamodb:Query', 'dynamodb:UpdateItem'],
      effect: iam.Effect.ALLOW,
      resources: [
        streamTable.tableArn,
        `${streamTable.tableArn}/index/startTimeIndex`
      ]
    });
    const metricsIvsPolicyStatement = new iam.PolicyStatement({
      actions: ['cloudwatch:GetMetricData', 'ivs:GetStreamSession'],
      effect: iam.Effect.ALLOW,
      resources: ['*']
    });
    policies.push(streamTablePolicyStatement, metricsIvsPolicyStatement);
    this.policies = policies;

    // Stream Events Container Image
    const containerImage = ecs.ContainerImage.fromAsset(
      path.join(__dirname, '../../streamEventsApi')
    );

    const streamEventsSecurityGroup = new ec2.SecurityGroup(
      this,
      'StreamEvents-Security-Group',
      { vpc }
    );

    streamEventsSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(8080),
      'Allow inbound traffic to 8080 IPv4'
    );
    streamEventsSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow inbound traffic to 80 IPv4'
    );

    // Stream Events Service
    const userTablePolicyStatement = new iam.PolicyStatement({
      actions: ['dynamodb:Query'],
      effect: iam.Effect.ALLOW,
      resources: [
        userTable.tableArn,
        `${userTable.tableArn}/index/channelArnIndex`
      ]
    });
    const { service: streamEventsService } = new Service(
      this,
      `${stackNamePrefix}-StreamEvents-Service`,
      {
        cluster,
        containerImage,
        environment: {
          STREAM_TABLE_NAME: streamTable.tableName,
          USER_TABLE_NAME: userTable.tableName
        },
        minScalingCapacity: 1,
        policies: [...policies, userTablePolicyStatement],
        prefix: 'StreamEvents',
        securityGroups: [streamEventsSecurityGroup]
      }
    );

    // Stream Events Load Balancer
    const streamEventsLoadBalancer = new elbv2.NetworkLoadBalancer(
      this,
      `StreamEvents-NLB`,
      { vpc }
    );
    const streamEventsListener = streamEventsLoadBalancer.addListener(
      'StreamEvents-Listener',
      { port: 80, protocol: elbv2.Protocol.TCP }
    );
    streamEventsListener.addTargets('stream-events-target', {
      healthCheck: {
        protocol: elbv2.Protocol.HTTP,
        path: '/status'
      },
      port: 8080,
      targets: [streamEventsService]
    });

    // Stream Events API Gateway
    const streamEventsApiGateway = new apigateway.RestApi(
      this,
      `${stackNamePrefix}-StreamEvents-API-Gateway`,
      {}
    );
    const link = new apigateway.VpcLink(this, 'link', {
      targets: [streamEventsLoadBalancer]
    });
    const integration = new apigateway.Integration({
      integrationHttpMethod: 'POST',
      options: {
        connectionType: apigateway.ConnectionType.VPC_LINK,
        vpcLink: link
      },
      type: apigateway.IntegrationType.HTTP_PROXY
    });
    streamEventsApiGateway.root
      .addResource('streamEvents')
      .addMethod('POST', integration);

    // Integration with EventBridge
    new events.Rule(this, `${stackNamePrefix}-StreamEvents-Rule`, {
      eventPattern: {
        source: ['aws.ivs']
      },
      targets: [
        new eventsTargets.ApiGateway(streamEventsApiGateway, {
          method: 'POST',
          path: '/streamEvents'
        })
      ]
    });

    // Stack Outputs
    this.containerEnv = {
      ACCOUNT_ID: NestedStack.of(this).account,
      REGION: NestedStack.of(this).region,
      IVS_CHANNEL_TYPE: ivsChannelType,
      /**
       * The following pagination values need to have specific lengths:
       * - PAGINATION_TOKEN_KEY should be 32 characters long
       * - PAGINATION_TOKEN_IV should be 16 characters long
       * These values are used to encode and decode the stream sessions pagination tokens
       * and should be changed before deploying to production.
       */
      PAGINATION_TOKEN_KEY: 'mqGmnKzveqqSQLbdXspNgJFHpLdCsy78',
      PAGINATION_TOKEN_IV: 'GhAnBByRBTJL9tgN',
      STREAM_TABLE_NAME: streamTable.tableName
    };
  }
}