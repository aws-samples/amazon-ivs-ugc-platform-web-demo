import { aws_iam as iam, NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class MetricsStack extends NestedStack {
  public readonly policies: iam.PolicyStatement[];

  constructor(scope: Construct, id: string, props: NestedStackProps) {
    super(scope, id, props);

    // IAM Policies
    const metricsIvsPolicyStatement = new iam.PolicyStatement({
      actions: [
        'cloudwatch:GetMetricData',
        'ivs:GetStreamSession',
        'ivs:ListStreamSessions'
      ],
      effect: iam.Effect.ALLOW,
      resources: ['*']
    });
    this.policies = [metricsIvsPolicyStatement];
  }
}
