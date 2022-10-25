import path from 'path';

import {
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as origins,
  aws_ec2 as ec2,
  aws_ecr_assets as ecrAssets,
  aws_ecs as ecs,
  aws_iam as iam,
  aws_s3 as s3,
  CfnOutput,
  RemovalPolicy,
  Stack,
  StackProps
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

import {
  defaultTargetProps,
  UGCResourceWithUserManagementConfig
} from './constants';
import { MetricsStack } from './MetricsStack/cdk-metrics-stack';
import { UserManagementStack } from './UserManagementStack/cdk-user-management-stack';
import LoadBalancer from './Constructs/LoadBalancer';
import Service from './Constructs/Service';

interface UGCDashboardStackProps extends StackProps {
  resourceConfig: UGCResourceWithUserManagementConfig;
  shouldPublish: string;
}

export class UGCStack extends Stack {
  constructor(scope: Construct, id: string, props: UGCDashboardStackProps) {
    super(scope, id, props);

    const { resourceConfig, shouldPublish } = props;
    const { ivsChannelType, maxAzs, natGateways, deploySeparateContainers } =
      resourceConfig;
    let { allowedOrigins } = resourceConfig;
    const stackNamePrefix = Stack.of(this).stackName;

    let frontendAppDistribution;
    let frontendAppBaseUrl = '';

    if (shouldPublish) {
      // Frontend App S3 Bucket
      const frontendAppS3Bucket = new s3.Bucket(
        this,
        `${stackNamePrefix}-FE-Bucket`,
        {
          autoDeleteObjects: true,
          blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
          removalPolicy: RemovalPolicy.DESTROY
        }
      );

      // Frontend App Cloudfront Distribution
      frontendAppDistribution = new cloudfront.Distribution(
        this,
        `${stackNamePrefix}-FE-CFDistribution`,
        {
          defaultBehavior: {
            origin: new origins.S3Origin(frontendAppS3Bucket),
            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
          },
          defaultRootObject: 'index.html',
          errorResponses: [
            {
              httpStatus: 403,
              responseHttpStatus: 200,
              responsePagePath: '/index.html'
            }
          ]
        }
      );

      frontendAppBaseUrl = `https://${frontendAppDistribution.domainName}`;

      allowedOrigins.push(frontendAppBaseUrl);
      resourceConfig.clientBaseUrl = frontendAppBaseUrl; // Override the clientBaseUrl

      // Export the bucket name, distribution ID and domain name for reference in the deployment stack
      new CfnOutput(this, `${stackNamePrefix}-FE-Bucket-Name`, {
        value: frontendAppS3Bucket.bucketName,
        exportName: `${id}-FE-Bucket-Name`
      });
      new CfnOutput(this, `${stackNamePrefix}-FE-CFDistribution-ID`, {
        value: frontendAppDistribution.distributionId,
        exportName: `${id}-FE-CFDistribution-ID`
      });
      new CfnOutput(this, `${stackNamePrefix}-FE-CFDistribution-Domain-Name`, {
        value: frontendAppDistribution.distributionDomainName,
        exportName: `${id}-FE-CFDistribution-Domain-Name`
      });
    }

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
      path.join(__dirname, '../api'),
      { platform: ecrAssets.Platform.LINUX_AMD64 } // Allows for ARM architectures to build docker images for AMD architectures
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
    const {
      containerEnv: metricsContainerEnv,
      policies: metricsPolicies,
      outputs: metricsOutputs
    } = new MetricsStack(this, 'Metrics', {
      cluster,
      ivsChannelType,
      userTable,
      vpc
    });

    // Attach extra policies and env variables to the User Management stack
    const { streamTable } = metricsOutputs;
    userManagementPolicies.push(
      new iam.PolicyStatement({
        actions: ['dynamodb:Query', 'dynamodb:UpdateItem'],
        effect: iam.Effect.ALLOW,
        resources: [
          streamTable.tableArn,
          `${streamTable.tableArn}/index/startTimeIndex`
        ]
      })
    );
    userManagementContainerEnv.STREAM_TABLE_NAME = streamTable.tableName;

    // This environment is required for any container that exposes authenticated endpoints
    const baseContainerEnv = {
      ALLOWED_ORIGINS: JSON.stringify(allowedOrigins),
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

    const containerEnvStr = `${Object.entries({
      ...sharedContainerEnv,
      SERVICE_NAME: 'all'
    })
      .map(([key, val]) => `${key}=${JSON.stringify(val)}`)
      .join(' \\\n')}`;
    const apiBaseUrl = `https://${distribution.domainName}`;
    const region = Stack.of(this).region;

    new CfnOutput(this, 'containerEnvStr', { value: containerEnvStr });
    new CfnOutput(this, 'apiBaseUrl', { value: apiBaseUrl });
    new CfnOutput(this, 'userPoolId', { value: userPoolId });
    new CfnOutput(this, 'userPoolClientId', { value: userPoolClientId });
    new CfnOutput(this, 'region', { value: region });

    if (frontendAppBaseUrl) {
      new CfnOutput(this, 'frontendAppBaseUrl', {
        value: frontendAppBaseUrl,
        exportName: `${id}-frontendAppBaseUrl`
      });
    }
  }
}
