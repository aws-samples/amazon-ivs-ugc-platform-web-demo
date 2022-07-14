import {
  aws_elasticloadbalancingv2 as elbv2,
  aws_logs as logs
} from 'aws-cdk-lib';
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

export const defaultTargetProps: Partial<elbv2.AddApplicationTargetsProps> = {
  healthCheck: { path: '/status' },
  port: 8080,
  protocol: elbv2.ApplicationProtocol.HTTP
};
