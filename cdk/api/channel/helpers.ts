import {
  ChatTokenCapability,
  CreateChatTokenCommand
} from '@aws-sdk/client-ivschat';
import { convertToAttr, unmarshall } from '@aws-sdk/util-dynamodb';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import {
  DeleteItemCommand,
  GetItemCommand,
  QueryCommand,
  UpdateItemCommand,
  UpdateItemCommandOutput
} from '@aws-sdk/client-dynamodb';
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command
} from '@aws-sdk/client-s3';
import { v5 as uuidv5 } from 'uuid';

import {
  CHATROOM_ARN_NOT_FOUND_EXCEPTION,
  FORBIDDEN_EXCEPTION,
  USER_NOT_FOUND_EXCEPTION
} from '../shared/constants';
import { dynamoDbClient, ivsChatClient, s3Client } from '../shared/helpers';

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
 * is not guaranteed to contain the case sensitive username as a user is allowed
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
  (typeof EnhancedChatTokenCapability)[keyof typeof EnhancedChatTokenCapability];

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
  viewerAttributes?: {
    avatar?: string;
    channelAssetUrls?: string;
    color?: string;
    displayName?: string;
  },
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

type EqualCondition = ['eq', string, string] | Record<string, string>;
type StartsWithCondition = ['starts-with', string, string];
type ContentLengthRangeCondition = ['content-length-range', number, number];
type Conditions =
  | EqualCondition
  | StartsWithCondition
  | ContentLengthRangeCondition;

export const generatePresignedPost = ({
  bucketName,
  contentType,
  key,
  maximumFileSize,
  expiry = 20,
  additionalConditions = []
}: {
  bucketName: string;
  contentType: string;
  key: string;
  maximumFileSize: number;
  expiry?: number;
  additionalConditions?: Conditions[];
}) => {
  const contentLengthRangeInBytes = maximumFileSize * Math.pow(10, 6);

  return createPresignedPost(s3Client, {
    Bucket: bucketName,
    Key: key,
    Expires: expiry,
    Conditions: [
      { bucket: bucketName }, // bucket condition
      ['starts-with', '$key', key], // key condition
      ['eq', '$Content-Type', contentType], // content type condition
      ['content-length-range', 0, contentLengthRangeInBytes], // content type condition
      ...additionalConditions
    ]
  });
};

export const deleteS3Object = ({
  bucketName,
  key
}: {
  bucketName: string;
  key: string;
}) => s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));

export const deleteS3ObjectsWithPrefix = async ({
  bucketName,
  prefix
}: {
  bucketName: string;
  prefix: string;
}) => {
  const { Contents = [] } = await s3Client.send(
    new ListObjectsV2Command({ Bucket: bucketName, Prefix: prefix })
  );
  const keys = Contents.map(({ Key }) => Key!);

  if (!keys.length) return;

  return s3Client.send(
    new DeleteObjectsCommand({
      Bucket: process.env.CHANNEL_ASSETS_BUCKET_NAME,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
        Quiet: true
      }
    })
  );
};

const NameSpace_OID = '6ba7b812-9dad-11d1-80b4-00c04fd430c8';
const namespaceUUID = process.env.NAMESPACE_UUID || NameSpace_OID;
export const generateDeterministicId = (value: string) =>
  uuidv5(value, namespaceUUID);

export interface Preference {
  name?: string;
  previewUrl?: string;
  uploadDateTime?: string;
}

export const processAssetPreference = (
  assetType: string,
  assetData: Preference,
  sub: string
) => {
  const { previewUrl, uploadDateTime, name } = assetData;
  return new Promise<UpdateItemCommandOutput>(async (resolve, reject) => {
    try {
      await dynamoDbClient.send(
        new UpdateItemCommand({
          UpdateExpression: `SET channelAssets.#${assetType} = if_not_exists(channelAssets.#${assetType}, :emptyMap)`,
          Key: { id: convertToAttr(sub) },
          ExpressionAttributeValues: { ':emptyMap': convertToAttr({}) },
          ExpressionAttributeNames: { [`#${assetType}`]: assetType },
          TableName: process.env.CHANNELS_TABLE_NAME!
        })
      );

      const updateExpressionArr = [
        `channelAssets.#${assetType}.#url = :previewUrl`,
        `channelAssets.#${assetType}.#lastModified = :lastModified`
      ];

      // For assets that contain a name (e.g. avatar), the corresponding attribute will also be updated
      if (name) {
        updateExpressionArr.push(`#${assetType} = :name`);
      }

      const updateExpression = `SET ${updateExpressionArr.join(', ')}`;
      const result = dynamoDbClient.send(
        new UpdateItemCommand({
          UpdateExpression: updateExpression,
          ConditionExpression: `attribute_not_exists(channelAssets.#${assetType}.#lastModified) or (channelAssets.#${assetType}.#lastModified < :lastModified)`,
          Key: { id: convertToAttr(sub) },
          ExpressionAttributeValues: {
            ...(name && { ':name': convertToAttr(name) }),
            ':previewUrl': convertToAttr(previewUrl),
            ':lastModified': convertToAttr(
              new Date(uploadDateTime ?? '').getTime()
            )
          },
          ExpressionAttributeNames: {
            '#url': 'url',
            '#lastModified': 'lastModified',
            [`#${assetType}`]: assetType
          },
          TableName: process.env.CHANNELS_TABLE_NAME!
        })
      );

      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
};
