import {
  aws_ec2 as ec2,
  aws_elasticloadbalancingv2 as elbv2
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface LoadBalancerProps {
  prefix: string;
  vpc: ec2.Vpc;
}

export default class LoadBalancer extends Construct {
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly listener: elbv2.ApplicationListener;

  constructor(scope: Construct, id: string, props: LoadBalancerProps) {
    super(scope, id);

    const { prefix, vpc } = props;

    const loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      `${prefix}-ALB`,
      { internetFacing: true, vpc }
    );
    this.loadBalancer = loadBalancer;

    const listener = loadBalancer.addListener(`${prefix}-Listener`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP
    });
    this.listener = listener;
  }
}
