import {
  aws_ecs as ecs,
  aws_ec2 as ec2,
  aws_iam as iam,
  aws_logs as logs,
  Duration,
  RemovalPolicy
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface ServiceProps {
  cluster: ecs.Cluster;
  containerImage: ecs.AssetImage;
  environment: { [key: string]: string };
  minScalingCapacity: number;
  policies: iam.PolicyStatement[];
  prefix: string;
  securityGroups?: ec2.SecurityGroup[];
}

export default class Service extends Construct {
  public readonly service: ecs.FargateService;

  constructor(scope: Construct, id: string, props: ServiceProps) {
    super(scope, id);

    const {
      containerImage,
      environment,
      minScalingCapacity,
      policies,
      prefix,
      securityGroups
    } = props;
    let { cluster } = props;

    const ecsTaskExecutionRole = new iam.Role(this, `${prefix}-Role`, {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description:
        'ECS task to pull container images and publish container logs to Amazon CloudWatch'
    });
    ecsTaskExecutionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AmazonECSTaskExecutionRolePolicy'
      )
    );
    policies.forEach((policy) => {
      ecsTaskExecutionRole.addToPolicy(policy);
    });

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

    // Fargate Service
    const service = new ecs.FargateService(this, `${prefix}-Service`, {
      cluster,
      taskDefinition: fargateTaskDefinition,
      securityGroups
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

    this.service = service;
  }
}
