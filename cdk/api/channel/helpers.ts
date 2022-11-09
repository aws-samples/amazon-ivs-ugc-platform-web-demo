import {
  DeleteItemCommand,
  GetItemCommand,
  QueryCommand
} from '@aws-sdk/client-dynamodb';
import {
  ChatTokenCapability,
  CreateChatTokenCommand
} from '@aws-sdk/client-ivschat';

import {
  CHATROOM_ARN_NOT_FOUND_EXCEPTION,
  FORBIDDEN_EXCEPTION,
  USER_NOT_FOUND_EXCEPTION
} from '../shared/constants';
import { convertToAttr, unmarshall } from '@aws-sdk/util-dynamodb';
import { dynamoDbClient, ivsChatClient } from '../shared/helpers';

export const getUser = (sub: string) => {
  const getItemCommand = new GetItemCommand({
    Key: { id: { S: sub } },
    TableName: process.env.CHANNELS_TABLE_NAME
  });

  return dynamoDbClient.send(getItemCommand);
};

export const getUserByEmail = (userEmail: string) => {
  const queryCommand = new QueryCommand({
    IndexName: 'emailIndex',
    TableName: process.env.CHANNELS_TABLE_NAME,
    Limit: 1,
    KeyConditionExpression: 'email = :userEmail',
    ExpressionAttributeValues: { ':userEmail': convertToAttr(userEmail) }
  });

  return dynamoDbClient.send(queryCommand);
};

/**
 * Important Note: the username is case sensitive!
 * When using this function, ensure that you are using the case sensitive
 * username that the account was most recently updated to. The access token
 * is not guranteed to contain the case sensitive username as a user is allowed
 * to sign in with a case insensitive username.
 */
export const getUserByUsername = (username: string) => {
  const queryCommand = new QueryCommand({
    IndexName: 'usernameIndex',
    TableName: process.env.CHANNELS_TABLE_NAME,
    Limit: 1,
    KeyConditionExpression: 'username = :username',
    ExpressionAttributeValues: { ':username': convertToAttr(username) }
  });

  return dynamoDbClient.send(queryCommand);
};

export const deleteUser = (sub: string) => {
  const deleteItemCommand = new DeleteItemCommand({
    Key: { id: { S: sub } },
    TableName: process.env.CHANNELS_TABLE_NAME
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

export class ChatTokenError extends Error {
  public readonly code;

  constructor(
    message: string,
    code: number = 500,
    name: string = 'ChatTokenError'
  ) {
    super(message);

    this.code = code;
    this.name = name;

    Object.setPrototypeOf(this, ChatTokenError.prototype);
  }
}

const EnhancedChatTokenCapability = {
  ...ChatTokenCapability,
  VIEW_MESSAGE: 'VIEW_MESSAGE'
} as const;
export type ChatTokenCapabilityType =
  typeof EnhancedChatTokenCapability[keyof typeof EnhancedChatTokenCapability];

/**
 * Creates an IVS chat room token with an optional set of capabilities.
 *
 * This token is only used to establish a connection with the Amazon IVS Chat Messaging API. If a token is not
 * used to establish a connection before the expiration time lapses, the token becomes invalid. Tokens are
 * valid for one minute from the time of creation and can only be used one time to establish a connection.
 *
 * Session duration refers to how long an established connection can remain active before it is automatically
 * terminated by the Amazon IVS Chat Messaging API (maximum 180 minutes). Once the session expires, a new
 * token must be generated and a new connection must be established. Session duration defaults to 60 minutes.
 *
 * Note: "capabilities" default to None, but the permission to VIEW messages is implicitly included in all requests.
 *
 * @param chatRoomOwnerUsername username of the user who owns the chat room that the client is trying to access (CASE SENSITIVE)
 * @param viewerAttributes an object describing the displayName (CASE SENSITIVE), avatar and color of the viewer
 * @param capabilities Set of capabilities that the user is allowed to perform in the room: SEND_MESSAGE | DISCONNECT_USER | DELETE_MESSAGE
 *
 * @example Create a token with read-only permissions
 * const result = await createChatRoomToken("chatroom-owner-username");
 *
 * @example Create a token with read and write permissions
 * const result = await createChatRoomToken(
 *  "chatroom-owner-username",
 *  { displayName: "viewer-username", avatar: "bear", color: "blue" },
 *  ['SEND_MESSAGE']
 * );
 */
export const createChatRoomToken = async (
  chatRoomOwnerUsername: string,
  viewerAttributes?: { displayName?: string; avatar?: string; color?: string },
  capabilities?: (ChatTokenCapability | string)[]
) => {
  let chatRoomArn, bannedUserSubs;
  const { Items } = await getUserByUsername(chatRoomOwnerUsername);
  if (Items?.length) {
    ({ chatRoomArn, bannedUserSubs } = unmarshall(Items[0]));
  } else {
    throw new ChatTokenError(
      `No chat room owner exists with the username ${chatRoomOwnerUsername}`,
      404,
      USER_NOT_FOUND_EXCEPTION
    );
  }

  if (!chatRoomArn) {
    throw new ChatTokenError(
      `Missing chatRoomArn for user ${chatRoomOwnerUsername}`,
      403,
      CHATROOM_ARN_NOT_FOUND_EXCEPTION
    );
  }

  const viewerUserId = viewerAttributes?.displayName;
  if (viewerUserId && bannedUserSubs) {
    const { Items: ViewerItems = [] } = await getUserByUsername(viewerUserId);

    if (!ViewerItems?.length) {
      throw new ChatTokenError(
        `No user exists with the username ${viewerUserId}`,
        403,
        FORBIDDEN_EXCEPTION
      );
    }

    const { id: viewerSub } = unmarshall(ViewerItems[0]);

    if (bannedUserSubs.has(viewerSub)) {
      throw new ChatTokenError(
        `The user ${viewerUserId} is banned from this chat room`,
        403,
        FORBIDDEN_EXCEPTION
      );
    }
  }

  return await ivsChatClient.send(
    new CreateChatTokenCommand({
      capabilities, // The permission to view messages is implicit
      userId: viewerUserId || `unknown-user-${Date.now().toString()}`,
      roomIdentifier: chatRoomArn,
      sessionDurationInMinutes: 60,
      ...(viewerAttributes ? { attributes: viewerAttributes } : {})
    })
  );
};
