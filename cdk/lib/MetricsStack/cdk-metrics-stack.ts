import {
  aws_apigateway as apigateway,
  aws_dynamodb as dynamodb,
  aws_ec2 as ec2,
  aws_ecr_assets as ecrAssets,
  aws_ecs as ecs,
  aws_elasticloadbalancingv2 as elbv2,
  aws_events as events,
  aws_events_targets as eventsTargets,
  aws_iam as iam,
  NestedStack,
  NestedStackProps,
  RemovalPolicy,
  Stack
} from 'aws-cdk-lib';
import { ChannelType } from '@aws-sdk/client-ivs';
import { Construct } from 'constructs';
import path from 'path';

import Service from '../Constructs/Service';

interface MetricsStackProps extends NestedStackProps {
  cluster: ecs.Cluster;
  ivsChannelType: ChannelType;
  channelsTable: dynamodb.Table;
  vpc: ec2.Vpc;
}

export class MetricsStack extends NestedStack {
  public readonly containerEnv: { [key: string]: string };
  public readonly outputs: { streamTable: dynamodb.Table };
  public readonly policies: iam.PolicyStatement[];

  constructor(scope: Construct, id: string, props: MetricsStackProps) {
    super(scope, id, props);

    const parentStackName = Stack.of(this.nestedStackParent!).stackName;
    const nestedStackName = 'Metrics';
    const stackNamePrefix = `${parentStackName}-${nestedStackName}`;
    const { cluster, ivsChannelType, channelsTable, vpc } = props;

    // Dynamo DB Stream Table
    const streamTable = new dynamodb.Table(
      this,
      `${nestedStackName}-StreamsTable`,
      {
        tableName: `${stackNamePrefix}-StreamsTable`,
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
    // This is required to get all open sessions
    streamTable.addGlobalSecondaryIndex({
      indexName: 'isOpenIndex',
      partitionKey: { name: 'channelArn', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'isOpen', type: dynamodb.AttributeType.STRING }
    });

    // IAM Policies
    const policies = [];
    const streamTablePolicyStatement = new iam.PolicyStatement({
      actions: ['dynamodb:Query', 'dynamodb:GetItem', 'dynamodb:UpdateItem'],
      effect: iam.Effect.ALLOW,
      resources: [
        streamTable.tableArn,
        `${streamTable.tableArn}/index/startTimeIndex`
      ]
    });
    const metricsCloudWatchPolicyStatement = new iam.PolicyStatement({
      actions: ['cloudwatch:GetMetricData'],
      effect: iam.Effect.ALLOW,
      resources: ['*']
    });
    const metricsIvsPolicyStatement = new iam.PolicyStatement({
      actions: ['ivs:GetStreamSession'],
      effect: iam.Effect.ALLOW,
      resources: ['*']
    });
    policies.push(
      streamTablePolicyStatement,
      metricsCloudWatchPolicyStatement,
      metricsIvsPolicyStatement
    );
    this.policies = policies;

    // Stream Events Container Image
    const containerImage = ecs.ContainerImage.fromAsset(
      path.join(__dirname, '../../streamEventsApi'),
      { platform: ecrAssets.Platform.LINUX_AMD64 } // Allows for ARM architectures to build docker images for AMD architectures
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
    const channelsTablePolicyStatement = new iam.PolicyStatement({
      actions: ['dynamodb:Query'],
      effect: iam.Effect.ALLOW,
      resources: [
        channelsTable.tableArn,
        `${channelsTable.tableArn}/index/channelArnIndex`
      ]
    });
    const { service: streamEventsService } = new Service(
      this,
      `${nestedStackName}-StreamEvents-Service`,
      {
        cluster,
        containerImage,
        environment: {
          STREAM_TABLE_NAME: streamTable.tableName,
          CHANNELS_TABLE_NAME: channelsTable.tableName
        },
        minScalingCapacity: 1,
        policies: [streamTablePolicyStatement, channelsTablePolicyStatement],
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
      `${nestedStackName}-StreamEvents-API-Gateway`,
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
    new events.Rule(this, `${nestedStackName}-StreamEvents-Rule`, {
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

    this.outputs = { streamTable };
  }
}
