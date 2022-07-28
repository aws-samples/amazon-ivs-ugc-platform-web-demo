import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  QueryCommand
} from '@aws-sdk/client-dynamodb';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { IvsClient } from '@aws-sdk/client-ivs';
import {
  IvschatClient,
  ChatTokenCapability,
  CreateChatTokenCommand
} from '@aws-sdk/client-ivschat';

import {
  CHATROOM_ARN_NOT_FOUND_EXCEPTION,
  USER_NOT_FOUND_EXCEPTION
} from '../shared/constants';
import { convertToAttr } from '@aws-sdk/util-dynamodb';

export const dynamoDbClient = new DynamoDBClient({});
export const cognitoClient = new CognitoIdentityProviderClient({});
export const ivsClient = new IvsClient({});
export const ivsChatClient = new IvschatClient({});

export const getUser = (sub: string) => {
  const getItemCommand = new GetItemCommand({
    Key: { id: { S: sub } },
    TableName: process.env.USER_TABLE_NAME
  });

  return dynamoDbClient.send(getItemCommand);
};

export const getUserByEmail = (userEmail: string) => {
  const queryCommand = new QueryCommand({
    IndexName: 'emailIndex',
    TableName: process.env.USER_TABLE_NAME,
    Limit: 1,
    KeyConditionExpression: 'email = :userEmail',
    ExpressionAttributeValues: { ':userEmail': convertToAttr(userEmail) }
  });

  return dynamoDbClient.send(queryCommand);
};

export const getUserByUsername = (username: string) => {
  const queryCommand = new QueryCommand({
    IndexName: 'usernameIndex',
    TableName: process.env.USER_TABLE_NAME,
    Limit: 1,
    KeyConditionExpression: 'username = :username',
    ExpressionAttributeValues: { ':username': convertToAttr(username) }
  });

  return dynamoDbClient.send(queryCommand);
};

export const deleteUser = (sub: string) => {
  const deleteItemCommand = new DeleteItemCommand({
    Key: { id: { S: sub } },
    TableName: process.env.USER_TABLE_NAME
  });

  return dynamoDbClient.send(deleteItemCommand);
};

export const getChannelArnParams = (
  channelArn: string
): { accountId?: string; region?: string; resourceId?: string } => {
  const groups = channelArn.match(
    /^arn:aws:ivs:(?<region>[a-z0-9-]+):(?<accountId>\d+):channel\/(?<resourceId>.+)/
  )?.groups;

  if (groups) {
    return groups;
  }

  return {};
};

/**
 * Creates an IVS chat room token with an optional set of capabilities.
 *
 * This token is only used to establish a connection with the Amazon IVS Chat Messaging API. If a token is
 * not used to establish a connection before this time lapses, the token becomes invalid. Tokens are valid
 * for one minute from the time of creation and can only be used once to establish a connection.
 *
 * Session duration refers to how long an established session can remain active before it is automatically
 * terminated by the Amazon IVS Chat Messaging API (maximum 180 minutes). Once the session expires, a new
 * token must be generated and a new connection must be established. Session duration defaults to 60 minutes.
 *
 * Note: "capabilities" default to None, but the permission to VIEW messages is implicitly included in all requests.
 *
 * @param chatRoomOwnerUsername username of the user who owns the chat room that the client is trying to access
 * @param viewerUsername unique username that identifies the user associated with this token
 * @param capabilities Set of capabilities that the user is allowed to perform in the room: SEND_MESSAGE | DISCONNECT_USER | DELETE_MESSAGE
 *
 * @example Create a token with read-only permissions
 * const result = await createChatRoomToken("chatroom-owner-username");
 *
 * @example Create a token with read and write permissions
 * const result = await createChatRoomToken(
 *  "chatroom-owner-username",
 *  "viewer-username",
 *  ['SEND_MESSAGE']
 * );
 */
export const createChatRoomToken = async (
  chatRoomOwnerUsername: string,
  viewerUsername?: string,
  capabilities?: (ChatTokenCapability | string)[]
) => {
  let chatRoomArn;
  const { Items } = await getUserByUsername(chatRoomOwnerUsername);

  if (Items?.length) {
    ({
      chatRoomArn: { S: chatRoomArn }
    } = Items[0]);
  } else {
    throw new Error(USER_NOT_FOUND_EXCEPTION);
  }

  if (!chatRoomArn) throw new Error(CHATROOM_ARN_NOT_FOUND_EXCEPTION);

  return await ivsChatClient.send(
    new CreateChatTokenCommand({
      capabilities, // The permission to view messages is implicit
      userId: viewerUsername || `unknown-user-${Date.now().toString()}`,
      roomIdentifier: chatRoomArn,
      sessionDurationInMinutes: 60,
      ...(viewerUsername ? { attributes: { displayName: viewerUsername } } : {})
    })
  );
};
