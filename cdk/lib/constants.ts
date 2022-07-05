import { aws_logs as logs } from 'aws-cdk-lib';
import { ChannelType } from '@aws-sdk/client-ivs';

export interface StreamHealthResourceWithUserManagementConfig
  extends UserManagementResourceConfig {
  deploySeparateContainers: boolean;
  maxAzs: number;
  natGateways: number;
  stageName: string;
}

export interface UserManagementResourceConfig {
  allowedOrigin: string;
  enableUserAutoVerify: boolean;
  ivsChannelType: ChannelType;
  logRetention?: logs.RetentionDays;
  minScalingCapacity: number;
  userManagementClientBaseUrl: string;
}
