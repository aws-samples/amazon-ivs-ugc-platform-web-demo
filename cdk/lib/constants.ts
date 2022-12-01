import {
  aws_elasticloadbalancingv2 as elbv2,
  aws_logs as logs
} from 'aws-cdk-lib';
import { ChannelType } from '@aws-sdk/client-ivs';

export interface UGCResourceWithChannelsConfig extends ChannelsResourceConfig {
  deploySeparateContainers: boolean;
  maxAzs: number;
  natGateways: number;
  stageName: string;
}

export interface ChannelsResourceConfig {
  allowedOrigins: string[];
  clientBaseUrl: string;
  enableUserAutoVerify: boolean;
  ivsChannelType: ChannelType;
  logRetention?: logs.RetentionDays;
  minScalingCapacity: number;
  signUpAllowedDomains: string[];
}

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
