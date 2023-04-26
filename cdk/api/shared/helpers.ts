import {
  AttributeValueUpdate,
  DynamoDBClient,
  QueryCommand,
  UpdateItemCommand
} from '@aws-sdk/client-dynamodb';
import { CloudWatchClient } from '@aws-sdk/client-cloudwatch';
import {
  CognitoIdentityProviderClient,
  CognitoIdentityProviderServiceException
} from '@aws-sdk/client-cognito-identity-provider';
import { convertToAttr } from '@aws-sdk/util-dynamodb';
import {
  GetStreamSessionCommand,
  IngestConfiguration,
  IvsClient,
  StreamEvent
} from '@aws-sdk/client-ivs';
import {
  IvschatClient,
  IvschatServiceException
} from '@aws-sdk/client-ivschat';
import { S3Client } from '@aws-sdk/client-s3';
import {
  SecretsManagerClient,
  GetSecretValueCommand
} from '@aws-sdk/client-secrets-manager';

import { ALLOWED_CHANNEL_ASSET_TYPES } from './constants';

type DynamoKey = { key: string; value: string };

export const cloudwatchClient = new CloudWatchClient({});
export const cognitoClient = new CognitoIdentityProviderClient({});
export const dynamoDbClient = new DynamoDBClient({});
export const ivsChatClient = new IvschatClient({});
export const ivsClient = new IvsClient({});
export const s3Client = new S3Client({});

export interface ResponseBody {
  [key: string]: any;
}

export type Period = 3600 | 300 | 60 | 5;

export type FormattedMetricData = {
  alignedStartTime: Date;
  data: number[];
  label: string;
  period: Period;
  statistics: {
    average?: number;
  };
};

export type DbFormattedMetricData = FormattedMetricData & {
  alignedStartTime: string;
};
export type DbStreamEvent = StreamEvent & {
  eventTime: string;
};
export interface StreamSessionDbRecord {
  channelArn?: string;
  endTime?: string;
  id?: string;
  ingestConfiguration?: IngestConfiguration;
  isHealthy?: boolean;
  metrics?: { [key: string]: DbFormattedMetricData[] };
  startTime?: string;
  truncatedEvents?: DbStreamEvent[];
  userSub?: string;
}

export interface ChannelDbRecord {
  avatar?: string;
  channelArn?: string;
  channelAssets?: ChannelAssets;
  chatRoomArn?: string;
  color?: string;
  email?: string;
  id?: string;
  ingestEndpoint?: string;
  playbackUrl?: string;
  streamKeyArn?: string;
  streamKeyValue?: string;
  username?: string;
  trackingId?: string;
}

export type FollowUserRequestBody = {
  followedUsername: string;
};

export interface ExtendedChannelDbRecord extends ChannelDbRecord {
  isLive: boolean;
}

export const isCognitoError = (
  error: any
): error is CognitoIdentityProviderServiceException => {
  return error && error.message;
};

export const getUserByChannelArn = (eventChannelArn: string) => {
  const queryCommand = new QueryCommand({
    IndexName: 'channelArnIndex',
    TableName: process.env.CHANNELS_TABLE_NAME,
    Limit: 1,
    KeyConditionExpression: 'channelArn=:eventChannelArn',
    ExpressionAttributeValues: {
      ':eventChannelArn': convertToAttr(eventChannelArn)
    }
  });

  return dynamoDbClient.send(queryCommand);
};

export const isIvsChatError = (
  error: any
): error is IvschatServiceException => {
  return error && error.message;
};

export const updateDynamoItemAttributes = ({
  attributes = [],
  primaryKey,
  sortKey,
  tableName
}: {
  attributes: { key: string; value: any }[];
  primaryKey: DynamoKey;
  sortKey?: DynamoKey;
  tableName: string;
}) => {
  if (!attributes.length) return;

  const attributesToUpdate = attributes.reduce(
    (acc, { key, value }) => ({
      ...acc,
      [key]: {
        Action: 'PUT',
        Value: convertToAttr(value, {
          removeUndefinedValues: true
        })
      }
    }),
    {}
  ) as { [key: string]: AttributeValueUpdate };

  const putItemCommand = new UpdateItemCommand({
    AttributeUpdates: attributesToUpdate,
    Key: {
      [primaryKey.key]: convertToAttr(primaryKey.value),
      ...(sortKey ? { [sortKey.key]: convertToAttr(sortKey.value) } : {})
    },
    TableName: tableName
  });

  return dynamoDbClient.send(putItemCommand);
};

const getIvsStreamSession = ({
  channelArn,
  streamSessionId
}: {
  channelArn: string;
  streamSessionId: string;
}) => {
  const getStreamSessionCommand = new GetStreamSessionCommand({
    channelArn,
    streamId: streamSessionId
  });

  return ivsClient.send(getStreamSessionCommand);
};

export const updateIngestConfiguration = async ({
  channelArn,
  streamSessionId
}: {
  channelArn: string;
  streamSessionId: string;
}) => {
  const { streamSession: { ingestConfiguration } = {} } =
    await getIvsStreamSession({ channelArn, streamSessionId });

  // Check that the ingest configuration has complete audio and video configs
  const isIngestConfigurationComplete = [
    ingestConfiguration?.audio,
    ingestConfiguration?.video
  ].every(
    (config) =>
      !!config && Object.values(config).some((val) => val !== '' && val !== 0)
  );

  if (isIngestConfigurationComplete) {
    await updateDynamoItemAttributes({
      attributes: [{ key: 'ingestConfiguration', value: ingestConfiguration }],
      primaryKey: { key: 'channelArn', value: channelArn },
      sortKey: { key: 'id', value: streamSessionId },
      tableName: process.env.STREAM_TABLE_NAME as string
    });
  }

  return isIngestConfigurationComplete ? ingestConfiguration : undefined;
};

export const getIsLive = (
  endTime: Date | string | undefined,
  truncatedEvents: StreamEvent[] | undefined
) =>
  !endTime &&
  !!truncatedEvents?.find(
    (truncatedEvent) => truncatedEvent.name === 'Stream Start'
  );

type ChannelAssets = Partial<
  Record<
    (typeof ALLOWED_CHANNEL_ASSET_TYPES)[number],
    {
      sequencer: string;
      url: string;
    }
  >
>;
export type ChannelAssetURLs = Partial<Record<keyof ChannelAssets, string>>;

export const getChannelAssetUrls = (channelAssets: ChannelAssets = {}) =>
  Object.entries(channelAssets).reduce<ChannelAssetURLs>(
    (channelAssetUrls, [assetType, { url }]) => ({
      ...channelAssetUrls,
      [assetType]: url
    }),
    {}
  );

export const isFulfilled = <T>(
  input: PromiseSettledResult<T>
): input is PromiseFulfilledResult<T> => input.status === 'fulfilled';

export const isRejected = (
  input: PromiseSettledResult<unknown>
): input is PromiseRejectedResult => input.status === 'rejected';

export const getChannelId = (channelArn: string) =>
  channelArn.split(':channel/')[1];

export const getSecrets = async (secretId: string) => {
  const client = new SecretsManagerClient({ region: process.env.REGION });

  const getSecretValueCommand = new GetSecretValueCommand({
    SecretId: secretId
  });

  try {
    const secretKeys = await client.send(getSecretValueCommand);

    // JSON key values
    const keys = JSON.parse(secretKeys?.SecretString || '{}');

    let emptyKeyValues: string[] = [];

    Object.keys(keys).forEach((keyName: string) => {
      if (!keys[keyName]) {
        emptyKeyValues.push(keyName);
      }
    });

    if (emptyKeyValues.length) {
      throw new Error(
        `The following keys: ${emptyKeyValues.join(
          ', '
        )} are empty, please visit the Secrets Manager inside the AWS console to fill in the values`
      );
    }

    return keys;
  } catch (error) {
    throw error;
  }
};
