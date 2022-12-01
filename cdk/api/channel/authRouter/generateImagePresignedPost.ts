import { FastifyReply, FastifyRequest } from 'fastify';
import { PresignedPost } from '@aws-sdk/s3-presigned-post';
import { unmarshall } from '@aws-sdk/util-dynamodb';

import {
  ALLOWED_CHANNEL_ASSET_TYPES,
  ALLOWED_IMAGE_CONTENT_TYPES,
  INVALID_PRESIGNED_POST_INPUT_EXCEPTION,
  MAXIMUM_IMAGE_FILE_SIZE,
  UNEXPECTED_EXCEPTION
} from '../../shared/constants';
import { generatePresignedPost, getUser } from '../helpers';
import { UserContext } from '../authorizer';

type ASSET_TYPE = typeof ALLOWED_CHANNEL_ASSET_TYPES[number];
type CONTENT_TYPE = typeof ALLOWED_IMAGE_CONTENT_TYPES[number];

interface GenerateImagePresignedPostRequestBody {
  assetType: ASSET_TYPE;
  contentType: CONTENT_TYPE;
}

const handler = async (
  request: FastifyRequest<{ Body: GenerateImagePresignedPostRequestBody }>,
  reply: FastifyReply
) => {
  const { sub, username } = request.requestContext.get('user') as UserContext;
  const { assetType, contentType } = request.body;
  const maximumFileSize = MAXIMUM_IMAGE_FILE_SIZE[assetType];
  let responseBody: PresignedPost;

  // Validate that an allowed asset type was provided
  if (!ALLOWED_CHANNEL_ASSET_TYPES.includes(assetType)) {
    const errorMsg = `Invalid value provided for assetType: ${
      assetType || '--'
    }. Acceptable asset types are ${ALLOWED_CHANNEL_ASSET_TYPES.join(', ')}.`;
    console.error(errorMsg);
    reply.statusCode = 400;

    return reply.send({
      __type: INVALID_PRESIGNED_POST_INPUT_EXCEPTION,
      message: errorMsg
    });
  }

  // Validate that an allowed image file format was provided
  if (!ALLOWED_IMAGE_CONTENT_TYPES.includes(contentType)) {
    const errorMsg = `Invalid value provided for contentType: ${
      contentType || '--'
    }. Acceptable content types are ${ALLOWED_IMAGE_CONTENT_TYPES.join(', ')}.`;
    console.error(errorMsg);
    reply.statusCode = 400;

    return reply.send({
      __type: INVALID_PRESIGNED_POST_INPUT_EXCEPTION,
      message: errorMsg
    });
  }

  // Validate that the maximum file size is greater than 0MB
  if (typeof maximumFileSize !== 'number' || maximumFileSize <= 0) {
    const errorMsg = `Invalid value provided for maximumFileSize: ${
      maximumFileSize ?? '--'
    }MB. maximumFileSize must be greater than 0MB.`;
    console.error(errorMsg);

    reply.statusCode = 400;

    return reply.send({
      __type: INVALID_PRESIGNED_POST_INPUT_EXCEPTION,
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

    responseBody = await generatePresignedPost({
      key: `${channelAssetId}/${assetType}`,
      bucketName: process.env.CHANNEL_ASSETS_BUCKET_NAME!,
      contentType,
      maximumFileSize
    });
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  return reply.send(responseBody);
};

export default handler;
