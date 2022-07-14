import {
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as origins,
  aws_ec2 as ec2,
  aws_ecs as ecs,
  CfnOutput,
  Stack,
  StackProps
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import path from 'path';

import {
  defaultTargetProps,
  StreamHealthResourceWithUserManagementConfig
} from './constants';
import { MetricsStack } from './MetricsStack/cdk-metrics-stack';
import { UserManagementStack } from './UserManagementStack/cdk-user-management-stack';
import LoadBalancer from './Constructs/LoadBalancer';
import Service from './Constructs/Service';

interface StreamHealthDashboardStackProps extends StackProps {
  resourceConfig: StreamHealthResourceWithUserManagementConfig;
}

export class StreamHealthDashboardStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: StreamHealthDashboardStackProps
  ) {
    super(scope, id, props);

    const { resourceConfig } = props;
    const {
      allowedOrigin,
      ivsChannelType,
      maxAzs,
      natGateways,
      deploySeparateContainers
    } = resourceConfig;
    const stackNamePrefix = Stack.of(this).stackName;

    // VPC
    const vpc = new ec2.Vpc(this, `${stackNamePrefix}-VPC`, {
      maxAzs,
      natGateways
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, `${stackNamePrefix}-Cluster`, {
      vpc
    });

    // Container image
    const containerImage = ecs.ContainerImage.fromAsset(
      path.join(__dirname, '../api')
    );

    // User Management Stack
    const {
      containerEnv: userManagementContainerEnv,
      outputs: { userPoolId, userPoolClientId, userTable },
      policies: userManagementPolicies
    } = new UserManagementStack(this, 'UserManagement', {
      resourceConfig
    });

    // Metrics Stack
    const { containerEnv: metricsContainerEnv, policies: metricsPolicies } =
      new MetricsStack(this, 'Metrics', {
        cluster,
        ivsChannelType,
        userTable,
        vpc
      });

    // This environment is required for any container that exposes authenticated endpoints
    const baseContainerEnv = {
      ALLOWED_ORIGIN: allowedOrigin,
      USER_POOL_CLIENT_ID: userPoolClientId,
      USER_POOL_ID: userPoolId
    };
    const sharedContainerEnv = {
      ...baseContainerEnv,
      ...userManagementContainerEnv,
      ...metricsContainerEnv
    };

    // Load Balancers and Fargate Services
    const defaultServiceProps = {
      ...resourceConfig,
      cluster,
      containerImage
    };
    let defaultLoadBalancer;
    let metricsLoadBalancer;

    /**
     * If deploySeparateContainers is set to true, we'll deploy two services, one for User Management and one for Metrics
     * If the value is false, we'll deploy the entire backend inside the User Management container to save on resources
     */
    if (deploySeparateContainers) {
      const {
        listener: userManagementListener,
        loadBalancer: userManagementLoadBalancer
      } = new LoadBalancer(this, 'UserManagementLoadBalancer', {
        prefix: 'UserManagement',
        vpc
      });
      const { service: userManagementService } = new Service(
        this,
        `${stackNamePrefix}-UserManagement-Service`,
        {
          ...defaultServiceProps,
          environment: {
            ...baseContainerEnv,
            ...userManagementContainerEnv,
            SERVICE_NAME: 'userManagement'
          },
          policies: userManagementPolicies,
          prefix: 'UserManagement'
        }
      );
      defaultLoadBalancer = userManagementLoadBalancer;

      userManagementListener.addTargets('userManagement-target', {
        ...defaultTargetProps,
        targets: [userManagementService]
      });

      let metricsListener;
      ({ listener: metricsListener, loadBalancer: metricsLoadBalancer } =
        new LoadBalancer(this, 'MetricsLoadBalancer', {
          prefix: 'Metrics',
          vpc
        }));
      const { service: metricsService } = new Service(
        this,
        `${stackNamePrefix}-Metrics-Service`,
        {
          ...defaultServiceProps,
          environment: {
            ...baseContainerEnv,
            ...metricsContainerEnv,
            SERVICE_NAME: 'metrics'
          },
          policies: metricsPolicies,
          prefix: 'Metrics'
        }
      );

      metricsListener.addTargets('metrics-target', {
        ...defaultTargetProps,
        targets: [metricsService]
      });
    } else {
      const { listener: sharedListener, loadBalancer: sharedLoadBalancer } =
        new LoadBalancer(this, 'SharedLoadBalancer', {
          prefix: 'Shared',
          vpc
        });
      const { service: sharedService } = new Service(
        this,
        `${stackNamePrefix}-Shared-Service`,
        {
          ...defaultServiceProps,
          environment: {
            ...sharedContainerEnv,
            SERVICE_NAME: 'all'
          },
          policies: [...userManagementPolicies, ...metricsPolicies],
          prefix: 'Shared'
        }
      );

      defaultLoadBalancer = sharedLoadBalancer;
      sharedListener.addTargets('shared-target', {
        ...defaultTargetProps,
        targets: [sharedService]
      });
    }

    // Cloudfront Distribution
    const defaultDistributionProps = {
      allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
      cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER
    };
    const defaultOriginProps = {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY
    };
    const distribution = new cloudfront.Distribution(
      this,
      `${stackNamePrefix}-CFDistribution`,
      {
        ...(metricsLoadBalancer
          ? {
              additionalBehaviors: {
                '/metrics/*': {
                  ...defaultDistributionProps,
                  origin: new origins.LoadBalancerV2Origin(
                    metricsLoadBalancer,
                    defaultOriginProps
                  )
                }
              }
            }
          : {}),
        defaultBehavior: {
          ...defaultDistributionProps,
          origin: new origins.LoadBalancerV2Origin(
            defaultLoadBalancer,
            defaultOriginProps
          )
        }
      }
    );

    new CfnOutput(this, 'containerEnvStr', {
      value: `${Object.entries({
        ...sharedContainerEnv,
        SERVICE_NAME: 'all'
      })
        .map(([key, val]) => `${key}=${val}`)
        .join(' \\\n')}`
    });
    new CfnOutput(this, 'userManagementApiBaseUrl', {
      value: `https://${distribution.domainName}`
    });
    new CfnOutput(this, 'userPoolId', { value: userPoolId });
    new CfnOutput(this, 'userPoolClientId', { value: userPoolClientId });
  }
}
