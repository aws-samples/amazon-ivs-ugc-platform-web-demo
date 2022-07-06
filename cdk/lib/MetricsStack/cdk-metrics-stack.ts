import {
  aws_dynamodb as dynamodb,
  aws_iam as iam,
  NestedStack,
  NestedStackProps,
  RemovalPolicy
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class MetricsStack extends NestedStack {
  public readonly containerEnv: { [key: string]: string };
  public readonly policies: iam.PolicyStatement[];

  constructor(scope: Construct, id: string, props: NestedStackProps) {
    super(scope, id, props);

    const stackNamePrefix = 'Metrics';

    // Dynamo DB Stream Table
    const streamTable = new dynamodb.Table(
      this,
      `${stackNamePrefix}-StreamTable`,
      {
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
        removalPolicy: RemovalPolicy.DESTROY
      }
    );

    // IAM Policies
    const policies = [];
    const streamTablePolicyStatement = new iam.PolicyStatement({
      actions: ['dynamodb:GetItem', 'dynamodb:UpdateItem'],
      effect: iam.Effect.ALLOW,
      resources: [streamTable.tableArn]
    });
    const metricsIvsPolicyStatement = new iam.PolicyStatement({
      actions: [
        'cloudwatch:GetMetricData',
        'ivs:GetStreamSession',
        'ivs:ListStreamSessions'
      ],
      effect: iam.Effect.ALLOW,
      resources: ['*']
    });
    policies.push(streamTablePolicyStatement, metricsIvsPolicyStatement);
    this.policies = policies;

    // Stack Outputs
    this.containerEnv = {
      ACCOUNT_ID: NestedStack.of(this).account,
      REGION: NestedStack.of(this).region,
      STREAM_TABLE_NAME: streamTable.tableName
    };
  }
}
