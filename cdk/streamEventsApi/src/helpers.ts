import {
  DynamoDBClient,
  QueryCommand,
  UpdateItemCommand
} from '@aws-sdk/client-dynamodb';
import { convertToAttr } from '@aws-sdk/util-dynamodb';

export const dynamoDbClient = new DynamoDBClient({});

export const getUserByChannelArn = (eventChannelArn: string) => {
  const queryCommand = new QueryCommand({
    IndexName: 'channelArnIndex',
    TableName: process.env.USER_TABLE_NAME,
    Limit: 1,
    KeyConditionExpression: 'channelArn=:eventChannelArn',
    ExpressionAttributeValues: { ':eventChannelArn': { S: eventChannelArn } }
  });

  return dynamoDbClient.send(queryCommand);
};

export type AdditionalStreamAttributes = {
  hasErrorEvent?: boolean;
  endTime?: string;
  startTime?: string;
};

export const getStreamsByChannelArn = (userChannelArn: string) => {
  const queryCommand = new QueryCommand({
    ScanIndexForward: false,
    ExpressionAttributeValues: { ':userChannelArn': { S: userChannelArn } },
    IndexName: 'startTimeIndex',
    KeyConditionExpression: 'channelArn=:userChannelArn',
    ProjectionExpression: 'startTime, id',
    TableName: process.env.STREAM_TABLE_NAME
  });

  return dynamoDbClient.send(queryCommand);
};

export const addStreamEventToDb = ({
  additionalAttributes = {},
  channelArn,
  newEvent,
  streamId,
  userSub
}: {
  additionalAttributes?: AdditionalStreamAttributes;
  channelArn: string;
  newEvent: {
    eventTime: string;
    name: string;
    type: string;
  };
  streamId: string;
  userSub: string;
}) => {
  let setAdditionalAttributesExpression = '';

  if (Object.keys(additionalAttributes).length) {
    setAdditionalAttributesExpression = `, ${Object.keys(additionalAttributes)
      .map((key) => `${key}=:${key}`)
      .join(', ')}`;
  }
  const updateItemCommand = new UpdateItemCommand({
    ExpressionAttributeValues: {
      ...Object.entries(additionalAttributes).reduce(
        (acc, [key, value]) => ({ ...acc, [`:${key}`]: convertToAttr(value) }),
        {}
      ),
      ':emptyList': convertToAttr([]),
      ':userSub': convertToAttr(userSub),
      ':newEvent': convertToAttr([newEvent])
    },
    Key: { channelArn: { S: channelArn }, id: { S: streamId } },
    UpdateExpression: `SET userSub=if_not_exists(userSub, :userSub), truncatedEvents=list_append(if_not_exists(truncatedEvents, :emptyList), :newEvent)${setAdditionalAttributesExpression}`,
    TableName: process.env.STREAM_TABLE_NAME
  });

  return dynamoDbClient.send(updateItemCommand);
};
