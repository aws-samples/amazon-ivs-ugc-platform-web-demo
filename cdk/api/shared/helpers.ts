import {
  AttributeValueUpdate,
  DynamoDBClient,
  UpdateItemCommand
} from '@aws-sdk/client-dynamodb';
import { convertToAttr } from '@aws-sdk/util-dynamodb';
import { GetStreamSessionCommand, IvsClient } from '@aws-sdk/client-ivs';

type DynamoKey = { key: string; value: string };

export const ivsClient = new IvsClient({});
export const dynamoDbClient = new DynamoDBClient({});

export const updateDynamoItemAttributes = ({
  attributes = [],
  dynamoDbClient,
  primaryKey,
  sortKey,
  tableName
}: {
  attributes: { key: string; value: any }[];
  dynamoDbClient: DynamoDBClient;
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

export const getIvsStreamSession = ({
  channelArn,
  streamSessionId,
  ivsClient
}: {
  channelArn: string;
  streamSessionId: string;
  ivsClient: IvsClient;
}) => {
  const getStreamSessionCommand = new GetStreamSessionCommand({
    channelArn,
    streamId: streamSessionId
  });

  return ivsClient.send(getStreamSessionCommand);
};

export const updateIngestConfiguration = async ({
  channelArn,
  streamSessionId,
  ivsClient,
  dynamoDbClient
}: {
  channelArn: string;
  streamSessionId: string;
  ivsClient: IvsClient;
  dynamoDbClient: DynamoDBClient;
}) => {
  const { streamSession: { ingestConfiguration } = {} } =
    await getIvsStreamSession({ channelArn, streamSessionId, ivsClient });

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
      dynamoDbClient,
      primaryKey: { key: 'channelArn', value: channelArn },
      sortKey: { key: 'id', value: streamSessionId },
      tableName: process.env.STREAM_TABLE_NAME as string
    });
  }

  return isIngestConfigurationComplete ? ingestConfiguration : undefined;
};
