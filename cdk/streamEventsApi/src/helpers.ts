import {
  DynamoDBClient,
  GetItemCommand,
  QueryCommand,
  UpdateItemCommand
} from '@aws-sdk/client-dynamodb';
import { convertToAttr, unmarshall } from '@aws-sdk/util-dynamodb';

export const dynamoDbClient = new DynamoDBClient({});

export type AdditionalStreamAttributes = {
  isHealthy?: boolean;
  hasErrorEvent?: boolean;
  startTime?: string;
  endTime?: string;
};

export type StreamEvent = {
  eventTime: string;
  name: string;
  type: string;
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

export const getStreamsByChannelArn = (userChannelArn: string) => {
  const queryCommand = new QueryCommand({
    ScanIndexForward: false,
    ExpressionAttributeValues: {
      ':userChannelArn': convertToAttr(userChannelArn)
    },
    IndexName: 'startTimeIndex',
    KeyConditionExpression: 'channelArn=:userChannelArn',
    ProjectionExpression: 'startTime, id',
    TableName: process.env.STREAM_TABLE_NAME
  });

  return dynamoDbClient.send(queryCommand);
};

export const getStreamEvents = async (
  channelArn: string,
  streamId: string
): Promise<StreamEvent[]> => {
  const { Item = {} } = await dynamoDbClient.send(
    new GetItemCommand({
      ConsistentRead: true,
      Key: {
        channelArn: convertToAttr(channelArn),
        id: convertToAttr(streamId)
      },
      ProjectionExpression: 'truncatedEvents',
      TableName: process.env.STREAM_TABLE_NAME
    })
  );
  const { truncatedEvents = [] } = unmarshall(Item);

  return truncatedEvents;
};

export const updateStreamEvents = ({
  additionalAttributes = {},
  channelArn,
  streamEvents,
  streamId,
  userSub
}: {
  additionalAttributes?: AdditionalStreamAttributes;
  channelArn: string;
  streamEvents: StreamEvent[];
  streamId: string;
  userSub: string;
}) => {
  const userSubUpdateExpression = 'userSub=if_not_exists(userSub, :userSub)';
  const truncatedEventsUpdateExpression = 'truncatedEvents=:truncatedEvents';
  const additionalAttributesExpression = `${Object.keys(additionalAttributes)
    .map((key) => `${key}=:${key}`)
    .join(', ')}`;
  const updateExpression = [
    userSubUpdateExpression,
    truncatedEventsUpdateExpression,
    additionalAttributesExpression
  ].join(', ');

  const updateItemCommand = new UpdateItemCommand({
    ExpressionAttributeValues: {
      ...Object.entries(additionalAttributes).reduce(
        (acc, [key, value]) => ({ ...acc, [`:${key}`]: convertToAttr(value) }),
        {}
      ),
      ':userSub': convertToAttr(userSub),
      ':truncatedEvents': convertToAttr(streamEvents)
    },
    Key: { channelArn: convertToAttr(channelArn), id: convertToAttr(streamId) },
    UpdateExpression: `SET ${updateExpression}`,
    TableName: process.env.STREAM_TABLE_NAME
  });

  return dynamoDbClient.send(updateItemCommand);
};
