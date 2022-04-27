import {
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_elasticloadbalancingv2 as elbv2,
  aws_iam as iam,
  aws_logs as logs,
  Duration,
  RemovalPolicy
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { UserManagementResourceConfig } from '../constants';

interface UserManagementServiceProps extends UserManagementResourceConfig {
  containerImage: ecs.AssetImage;
  ecsTaskExecutionRole: iam.Role;
  environment: { [key: string]: string };
  prefix: string;
  vpc?: ec2.IVpc;
}

export default class UserManagementService extends Construct {
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: UserManagementServiceProps) {
    super(scope, id);

    const {
      containerImage,
      ecsTaskExecutionRole,
      environment,
      maxAzs,
      minScalingCapacity,
      natGateways,
      prefix
    } = props;
    let { vpc } = props;

    // Fargate Task Definition
    const fargateTaskDefinition = new ecs.FargateTaskDefinition(
      this,
      `${prefix}-TaskDefinition`,
      {
        cpu: 256,
        memoryLimitMiB: 512,
        taskRole: ecsTaskExecutionRole
      }
    );

    // Cloudwatch Log Group
    const logGroup = new logs.LogGroup(this, `${prefix}-LogGroup`, {
      removalPolicy: RemovalPolicy.DESTROY
    });

    // Container
    const container = fargateTaskDefinition.addContainer(
      `${prefix}-Container`,
      {
        environment,
        image: containerImage,
        logging: new ecs.AwsLogDriver({
          logGroup,
          streamPrefix: prefix
        }),
        healthCheck: {
          command: [
            'CMD-SHELL',
            'curl -f http://localhost:8080/status || exit 1'
          ],
          retries: 5,
          startPeriod: Duration.seconds(5)
        }
      }
    );
    container.addPortMappings({ containerPort: 8080 });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, `${prefix}-Cluster`, {
      vpc
    });

    // Fargate Service
    const service = new ecs.FargateService(this, `${prefix}-Service`, {
      cluster,
      taskDefinition: fargateTaskDefinition
    });
    const scaling = service.autoScaleTaskCount({
      maxCapacity: 30,
      minCapacity: minScalingCapacity
    });
    scaling.scaleOnCpuUtilization('CpuScaling', {
      scaleInCooldown: Duration.seconds(60),
      scaleOutCooldown: Duration.seconds(60),
      targetUtilizationPercent: 70
    });

    // If vpc is not provided, create your own
    if (!vpc) {
      // VPC
      vpc = new ec2.Vpc(this, `${prefix}-VPC`, {
        maxAzs,
        natGateways
      });
    }

    // Load Balancer
    const loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      `${prefix}-ALB`,
      { internetFacing: true, vpc }
    );
    const listener = loadBalancer.addListener(`${prefix}-Listener`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP
    });

    listener.addTargets('target', {
      healthCheck: { path: '/status' },
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [service]
    });

    this.loadBalancer = loadBalancer;
  }
}
