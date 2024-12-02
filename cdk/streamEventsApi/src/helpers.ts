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
  isOpen?: string;
  hasErrorEvent?: boolean;
  startTime?: string;
  endTime?: string;
};

export type StreamEvent = {
  eventTime: string;
  name: string;
  type: string;
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

const getLiveStreamsByChannelArn = (userChannelArn: string) =>
  dynamoDbClient.send(
    new QueryCommand({
      TableName: process.env.STREAM_TABLE_NAME,
      IndexName: 'isOpenIndex',
      ExpressionAttributeValues: {
        ':userChannelArn': convertToAttr(userChannelArn)
      },
      KeyConditionExpression: 'channelArn=:userChannelArn',
      ProjectionExpression: 'id'
    })
  );

export const setOldLiveStreamsOffline = async (userChannelArn: string) => {
  try {
    const { Items: liveStreamSessions = [] } = await getLiveStreamsByChannelArn(
      userChannelArn
    );

    const updateLiveStreamsPromises = liveStreamSessions.map(
      (liveStreamSession) => {
        const { id } = unmarshall(liveStreamSession);
        return updateStreamSessionToOffline({
          channelArn: userChannelArn,
          streamId: id
        });
      }
    );
    const updateLiveStreamsResults = await Promise.allSettled(
      updateLiveStreamsPromises
    );
    updateLiveStreamsResults.forEach((result) => {
      if (result.status === 'rejected')
        console.error('Failed to update stream session:', result.reason);
    });
  } catch (error) {
    console.error(
      'Error occurred while updating old live stream sessions:',
      error
    );
  }
};

export const updateStreamEvents = ({
  additionalAttributes = {},
  attributesToRemove = [],
  channelArn,
  streamEvents,
  streamId,
  userSub
}: {
  additionalAttributes?: AdditionalStreamAttributes;
  attributesToRemove?: string[];
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
  const removeClause = attributesToRemove.length
    ? `REMOVE ${attributesToRemove.join(',')}`
    : '';
  const setClause = `SET ${[
    userSubUpdateExpression,
    truncatedEventsUpdateExpression,
    additionalAttributesExpression
  ].join(', ')}`;

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
    UpdateExpression: [setClause, removeClause].join(' '),
    TableName: process.env.STREAM_TABLE_NAME
  });

  return dynamoDbClient.send(updateItemCommand);
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

export const updateStreamSessionToOffline = ({
  channelArn,
  streamId
}: {
  channelArn: string;
  streamId: string;
}) => {
  const updateCommand = new UpdateItemCommand({
    TableName: process.env.STREAM_TABLE_NAME,
    Key: {
      channelArn: convertToAttr(channelArn),
      id: convertToAttr(streamId)
    },
    UpdateExpression: 'REMOVE isOpen' // Removing isOpen attr equals to setting the session to be offline
  });

  return dynamoDbClient.send(updateCommand);
};
