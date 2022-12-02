import { convertToAttr, unmarshall } from '@aws-sdk/util-dynamodb';
import { FastifyReply, FastifyRequest } from 'fastify';

import {
  DELETE_CHANNEL_ASSET_EXCEPTION,
  UNEXPECTED_EXCEPTION
} from '../../shared/constants';
import { deleteS3Object, getUser } from '../helpers';
import { dynamoDbClient } from '../../shared/helpers';
import { UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { UserContext } from '../authorizer';

interface DeleteChannelAssetRequestBody {
  assetType: string;
}

const handler = async (
  request: FastifyRequest<{ Body: DeleteChannelAssetRequestBody }>,
  reply: FastifyReply
) => {
  const { sub, username } = request.requestContext.get('user') as UserContext;
  const { assetType } = request.body;

  // Check input
  if (!assetType) {
    const errorMsg = `Missing an assetType to delete for user ${username}. Received: ${assetType}.`;
    console.error(errorMsg);

    reply.statusCode = 400;

    return reply.send({
      __type: DELETE_CHANNEL_ASSET_EXCEPTION,
      message: errorMsg
    });
  }

  try {
    const { Item: UserItem = {} } = await getUser(sub);
    const { channelAssetId } = unmarshall(UserItem);

    if (!channelAssetId) {
      console.error(`Missing channelAssetId for user ${username}`);

      reply.statusCode = 500;

      return reply.send({ __type: UNEXPECTED_EXCEPTION });
    }

    // Delete the object from the Channel Assets S3 bucket
    await deleteS3Object({
      bucketName: process.env.CHANNEL_ASSETS_BUCKET_NAME!,
      key: [channelAssetId, assetType].join('/')
    });

    // Once the S3 object is deleted, it is safe to remove the
    // channel asset data from the Channels table record
    await dynamoDbClient.send(
      new UpdateItemCommand({
        TableName: process.env.CHANNELS_TABLE_NAME,
        Key: { id: convertToAttr(sub) },
        UpdateExpression: `REMOVE channelAssets.#${assetType}`,
        ExpressionAttributeNames: { [`#${assetType}`]: assetType }
      })
    );
  } catch (error) {
    /**
     * If either the DeleteObjects or UpdateItem commands fail,
     * we return an exception to signify a complete failure so
     * that the user knows to retry the request
     */
    console.error(error);

    reply.statusCode = 500;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  reply.statusCode = 204;

  return reply.send();
};

export default handler;
