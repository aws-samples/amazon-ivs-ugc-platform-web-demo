import {
  AttributeValueUpdate,
  DynamoDBClient,
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

type DynamoKey = { key: string; value: string };

export const cloudwatchClient = new CloudWatchClient({});
export const cognitoClient = new CognitoIdentityProviderClient({});
export const dynamoDbClient = new DynamoDBClient({});
export const ivsChatClient = new IvschatClient({});
export const ivsClient = new IvsClient({});

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
  endTime?: string;
  id?: string;
  ingestConfiguration?: IngestConfiguration;
  isHealthy?: boolean;
  metrics?: { [key: string]: DbFormattedMetricData[] };
  startTime?: string;
  truncatedEvents?: DbStreamEvent[];
  userSub?: string;
}

export const isCognitoError = (
  error: any
): error is CognitoIdentityProviderServiceException => {
  return error && error.message;
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
