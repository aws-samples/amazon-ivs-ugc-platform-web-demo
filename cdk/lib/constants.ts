import {
  aws_elasticloadbalancingv2 as elbv2,
  aws_lambda_nodejs as lambda,
  aws_logs as logs
} from 'aws-cdk-lib';
import { ChannelType, TranscodePreset } from '@aws-sdk/client-ivs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

export interface UGCResourceWithChannelsConfig extends ChannelsResourceConfig {
  deploySeparateContainers: boolean;
  maxAzs: number;
  natGateways: number;
  stageName: string;
  productApiLocale: string;
  productLinkRegionCode: string;
  enableAmazonProductStreamAction: boolean;
}

export interface ChannelsResourceConfig {
  allowedOrigins: string[];
  clientBaseUrl: string;
  enableUserAutoVerify: boolean;
  ivsAdvancedChannelTranscodePreset: TranscodePreset | string;
  ivsChannelType: ChannelType;
  logRetention?: logs.RetentionDays;
  minScalingCapacity: number;
  signUpAllowedDomains: string[];
}

export const defaultLambdaParams: Partial<lambda.NodejsFunctionProps> = {
  bundling: { minify: true },
  runtime: Runtime.NODEJS_18_X
};

export const defaultTargetProps: Partial<elbv2.AddApplicationTargetsProps> = {
  healthCheck: { path: '/status' },
  port: 8080,
  protocol: elbv2.ApplicationProtocol.HTTP
};

/**
 * When adding a new asset type, be sure to add it to the following places:
 * - ALLOWED_CHANNEL_ASSET_TYPES
 * - [cdk/api/shared/constants.ts](../api/shared/constants.ts) -> MAXIMUM_IMAGE_FILE_SIZE
 * - [cdk/api/shared/constants.ts](../api/shared/constants.ts) -> ALLOWED_CHANNEL_ASSET_TYPES
 */
export const ALLOWED_CHANNEL_ASSET_TYPES = ['avatar', 'banner'] as const;
