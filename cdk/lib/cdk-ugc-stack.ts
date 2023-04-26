import path from "path";

import {
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as origins,
  aws_ec2 as ec2,
  aws_ecr_assets as ecrAssets,
  aws_ecs as ecs,
  aws_iam as iam,
  aws_s3 as s3,
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  StackProps,
  Tags,
} from "aws-cdk-lib";
import { Construct } from "constructs";

import { ChannelsStack } from "./ChannelsStack/cdk-channels-stack";
import { defaultTargetProps, UGCResourceWithChannelsConfig } from "./constants";
import { MetricsStack } from "./MetricsStack/cdk-metrics-stack";
import LoadBalancer from "./Constructs/LoadBalancer";
import Service from "./Constructs/Service";

interface UGCDashboardStackProps extends StackProps {
  resourceConfig: UGCResourceWithChannelsConfig;
  shouldPublish: boolean;
}

export class UGCStack extends Stack {
  constructor(scope: Construct, id: string, props: UGCDashboardStackProps) {
    super(scope, id, props);

    const { resourceConfig, shouldPublish, tags = {} } = props;
    const {
      deploySeparateContainers,
      ivsChannelType,
      maxAzs,
      natGateways,
      stageName,
      productApiLocale,
      productLinkRegionCode,
      enableAmazonProductStreamAction,
    } = resourceConfig;
    let { allowedOrigins } = resourceConfig;
    const stackNamePrefix = Stack.of(this).stackName;
    const accountId = Stack.of(this).account;
    const region = Stack.of(this).region;

    let frontendAppDistribution;
    let frontendAppBaseUrl = "";

    if (shouldPublish) {
      // Frontend App S3 Bucket
      const frontendAppS3Bucket = new s3.Bucket(
        this,
        `${stackNamePrefix}-FE-Bucket`,
        {
          autoDeleteObjects: true,
          blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
          removalPolicy: RemovalPolicy.DESTROY,
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
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          },
          defaultRootObject: "index.html",
          errorResponses: [
            {
              httpStatus: 403,
              responseHttpStatus: 200,
              responsePagePath: "/index.html",
            },
          ],
        }
      );

      frontendAppBaseUrl = `https://${frontendAppDistribution.domainName}`;

      allowedOrigins.push(frontendAppBaseUrl);
      resourceConfig.clientBaseUrl = frontendAppBaseUrl; // Override the clientBaseUrl

      // Export the bucket name, distribution ID and domain name for reference in the deployment stack
      new CfnOutput(this, `${stackNamePrefix}-FE-Bucket-Name`, {
        value: frontendAppS3Bucket.bucketName,
        exportName: `${id}-FE-Bucket-Name`,
      });
      new CfnOutput(this, `${stackNamePrefix}-FE-CFDistribution-ID`, {
        value: frontendAppDistribution.distributionId,
        exportName: `${id}-FE-CFDistribution-ID`,
      });
      new CfnOutput(this, `${stackNamePrefix}-FE-CFDistribution-Domain-Name`, {
        value: frontendAppDistribution.distributionDomainName,
        exportName: `${id}-FE-CFDistribution-Domain-Name`,
      });
    }

    // VPC
    const vpc = new ec2.Vpc(this, `${stackNamePrefix}-VPC`, {
      maxAzs,
      natGateways,
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, `${stackNamePrefix}-Cluster`, {
      vpc,
    });

    // Container image
    const containerImage = ecs.ContainerImage.fromAsset(
      path.join(__dirname, "../api"),
      { platform: ecrAssets.Platform.LINUX_AMD64 } // Allows for ARM architectures to build docker images for AMD architectures
    );

    // Channels Stack
    const channelsStack = new ChannelsStack(this, "Channels", {
      resourceConfig,
      tags,
    });
    const {
      containerEnv: channelsContainerEnv,
      outputs: {
        userPoolId,
        userPoolClientId,
        channelsTable,
        productApiSecretName,
      },
      policies: channelsPolicies,
    } = channelsStack;
    Tags.of(channelsStack).add("nestedStack", "channels");

    // Metrics Stack
    const metricsStack = new MetricsStack(this, "Metrics", {
      cluster,
      ivsChannelType,
      channelsTable,
      vpc,
    });
    const {
      containerEnv: metricsContainerEnv,
      policies: metricsPolicies,
      outputs: metricsOutputs,
    } = metricsStack;
    Tags.of(metricsStack).add("nestedStack", "metrics");

    // Attach extra policies and env variables to the Channels stack
    const { streamTable } = metricsOutputs;
    channelsPolicies.push(
      new iam.PolicyStatement({
        actions: ["dynamodb:Query", "dynamodb:UpdateItem"],
        effect: iam.Effect.ALLOW,
        resources: [
          streamTable.tableArn,
          `${streamTable.tableArn}/index/startTimeIndex`,
        ],
      }),
      new iam.PolicyStatement({
        actions: ["dynamodb:Scan"],
        effect: iam.Effect.ALLOW,
        resources: [
          streamTable.tableArn,
          `${streamTable.tableArn}/index/isOpenIndex`,
        ],
      })
    );
    channelsContainerEnv.STREAM_TABLE_NAME = streamTable.tableName;

    // This environment is required for any container that exposes authenticated endpoints
    const baseContainerEnv = {
      ACCOUNT_ID: accountId,
      ALLOWED_ORIGINS: JSON.stringify(allowedOrigins),
      REGION: region,
      USER_POOL_CLIENT_ID: userPoolClientId,
      USER_POOL_ID: userPoolId,
      PRODUCT_API_LOCALE: productApiLocale,
      PRODUCT_LINK_REGION_CODE: productLinkRegionCode,
      ENABLE_AMAZON_PRODUCT_STREAM_ACTION: `${enableAmazonProductStreamAction}`,
      PRODUCT_API_SECRET_NAME: productApiSecretName,
    };
    const sharedContainerEnv = {
      ...baseContainerEnv,
      ...channelsContainerEnv,
      ...metricsContainerEnv,
    };

    // Load Balancers and Fargate Services
    const defaultServiceProps = {
      ...resourceConfig,
      cluster,
      containerImage,
    };
    let defaultLoadBalancer;
    let metricsLoadBalancer;

    /**
     * If deploySeparateContainers is set to true, we'll deploy two services, one for Channels and one for Metrics
     * If the value is false, we'll deploy the entire backend inside the Channels container to save on resources
     */
    if (deploySeparateContainers) {
      const {
        listener: channelsListener,
        loadBalancer: channelsLoadBalancer,
      } = new LoadBalancer(this, "ChannelsLoadBalancer", {
        prefix: "Channels",
        vpc,
      });
      const { service: channelsService } = new Service(
        this,
        `${stackNamePrefix}-Channels-Service`,
        {
          ...defaultServiceProps,
          environment: {
            ...baseContainerEnv,
            ...channelsContainerEnv,
            SERVICE_NAME: "channels",
          },
          policies: channelsPolicies,
          prefix: "Channels",
        }
      );
      defaultLoadBalancer = channelsLoadBalancer;

      channelsListener.addTargets("channels-target", {
        ...defaultTargetProps,
        targets: [channelsService],
      });

      let metricsListener;
      ({
        listener: metricsListener,
        loadBalancer: metricsLoadBalancer,
      } = new LoadBalancer(this, "MetricsLoadBalancer", {
        prefix: "Metrics",
        vpc,
      }));
      const { service: metricsService } = new Service(
        this,
        `${stackNamePrefix}-Metrics-Service`,
        {
          ...defaultServiceProps,
          environment: {
            ...baseContainerEnv,
            ...metricsContainerEnv,
            SERVICE_NAME: "metrics",
          },
          policies: metricsPolicies,
          prefix: "Metrics",
        }
      );

      metricsListener.addTargets("metrics-target", {
        ...defaultTargetProps,
        targets: [metricsService],
      });
    } else {
      const {
        listener: sharedListener,
        loadBalancer: sharedLoadBalancer,
      } = new LoadBalancer(this, "SharedLoadBalancer", {
        prefix: "Shared",
        vpc,
      });
      const { service: sharedService } = new Service(
        this,
        `${stackNamePrefix}-Shared-Service`,
        {
          ...defaultServiceProps,
          environment: {
            ...sharedContainerEnv,
            SERVICE_NAME: "all",
          },
          policies: [...channelsPolicies, ...metricsPolicies],
          prefix: "Shared",
        }
      );

      defaultLoadBalancer = sharedLoadBalancer;
      sharedListener.addTargets("shared-target", {
        ...defaultTargetProps,
        targets: [sharedService],
      });
    }

    // Cloudfront Distribution
    const defaultOriginProps = {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
    };
    const defaultLoadBalancerOrigin = new origins.LoadBalancerV2Origin(
      defaultLoadBalancer,
      defaultOriginProps
    );
    const defaultBehavior = {
      allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
      cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
      origin: defaultLoadBalancerOrigin,
    };
    const additionalBehaviors = {
      // When the stack is deployed in separate containers, link the metrics endpoints to the correct load balancer
      ...(metricsLoadBalancer
        ? {
            "/metrics/*": {
              ...defaultBehavior,
              origin: new origins.LoadBalancerV2Origin(
                metricsLoadBalancer,
                defaultOriginProps
              ),
            },
          }
        : {}),
      "/channels": {
        ...defaultBehavior,
        cachePolicy: new cloudfront.CachePolicy(
          this,
          `${stackNamePrefix}-channelsResource-CachePolicy`,
          {
            defaultTtl: Duration.seconds(2),
            enableAcceptEncodingBrotli: true,
            enableAcceptEncodingGzip: true,
            queryStringBehavior: cloudfront.CacheQueryStringBehavior.allowList(
              "isLive"
            ),
          }
        ),
      },
    };
    const distribution = new cloudfront.Distribution(
      this,
      `${stackNamePrefix}-CFDistribution`,
      { additionalBehaviors, defaultBehavior }
    );

    const containerEnvStr = `${Object.entries({
      ...sharedContainerEnv,
      SERVICE_NAME: "all",
    })
      .map(([key, val]) => `${key}=${JSON.stringify(val)}`)
      .join(" \\\n")}`;
    const apiBaseUrl = `https://${distribution.domainName}`;

    new CfnOutput(this, "containerEnvStr", { value: containerEnvStr });
    new CfnOutput(this, "apiBaseUrl", { value: apiBaseUrl });
    new CfnOutput(this, "userPoolId", { value: userPoolId });
    new CfnOutput(this, "userPoolClientId", { value: userPoolClientId });
    new CfnOutput(this, "region", { value: region });
    new CfnOutput(this, "stage", { value: stageName });
    new CfnOutput(this, "enableAmazonProductStreamAction", {
      value: `${enableAmazonProductStreamAction}`,
    });
    new CfnOutput(this, "channelType", { value: ivsChannelType });

    if (frontendAppBaseUrl) {
      new CfnOutput(this, "frontendAppBaseUrl", {
        value: frontendAppBaseUrl,
        exportName: `${id}-frontendAppBaseUrl`,
      });
    }
  }
}
