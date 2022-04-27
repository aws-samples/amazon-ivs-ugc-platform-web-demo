import { aws_logs as logs } from 'aws-cdk-lib';
import { ChannelType } from '@aws-sdk/client-ivs';

export interface UserManagementResourceConfig {
  allowedOrigin: string;
  enableUserAutoVerify: boolean;
  ivsChannelType: ChannelType;
  logRetention?: logs.RetentionDays;
  maxAzs: number;
  minScalingCapacity: number;
  natGateways: number;
  stageName: string;
  userManagementClientBaseUrl: string;
}
