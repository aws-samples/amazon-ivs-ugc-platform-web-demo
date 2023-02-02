import {
  UpdateItemCommand,
  UpdateItemCommandOutput
} from '@aws-sdk/client-dynamodb';
import { convertToAttr } from '@aws-sdk/util-dynamodb';
import { FastifyReply, FastifyRequest } from 'fastify';

import { CHANGE_USER_PREFERENCES_EXCEPTION } from '../../shared/constants';
import {
  dynamoDbClient,
  updateDynamoItemAttributes
} from '../../shared/helpers';
import { UserContext } from '../authorizer';

interface Preference {
  name?: string;
  previewUrl?: string;
  uploadDateTime?: string;
}

interface ChangeUserPreferencesRequestBody {
  [key: string]: Preference;
}

const handler = async (
  request: FastifyRequest<{ Body: ChangeUserPreferencesRequestBody }>,
  reply: FastifyReply
) => {
  const { sub, username } = request.requestContext.get('user') as UserContext;
  const { body: preferences } = request;

  if (!Object.keys(preferences).length) {
    throw new Error(`Missing new user preferences for user: ${username}`);
  }

  try {
    const promises: Promise<UpdateItemCommandOutput | undefined>[] = [];
    const nonAssetPreferences = Object.entries(
      preferences
    ).reduce<{ key: string; value: any }[]>((acc, [key, value]) => {
      if (!value) return acc;

      const { name, previewUrl, uploadDateTime } = value;
      const isAsset = !!previewUrl && !!uploadDateTime;

      if ((previewUrl && !uploadDateTime) || (!previewUrl && uploadDateTime)) {
        const missingKey = !previewUrl ? 'previewUrl' : 'uploadDateTime';

        throw new Error(
          `${missingKey} is missing from the asset preference data`
        );
      }

      if (isAsset) {
        promises.push(
          new Promise<UpdateItemCommandOutput>(async (resolve, reject) => {
            try {
              await dynamoDbClient.send(
                new UpdateItemCommand({
                  UpdateExpression: `SET channelAssets.#${key} = if_not_exists(channelAssets.#${key}, :emptyMap)`,
                  Key: { id: convertToAttr(sub) },
                  ExpressionAttributeValues: { ':emptyMap': convertToAttr({}) },
                  ExpressionAttributeNames: { [`#${key}`]: key },
                  TableName: process.env.CHANNELS_TABLE_NAME!
                })
              );

              const updateExpressionArr = [
                `channelAssets.#${key}.#url = :previewUrl`,
                `channelAssets.#${key}.#lastModified = :lastModified`
              ];

              // For assets that contain a name (e.g. avatar), the corresponding attribute will also be updated
              if (value.name) {
                updateExpressionArr.push(`#${key} = :name`);
              }

              const updateExpression = `SET ${updateExpressionArr.join(', ')}`;
              const result = dynamoDbClient.send(
                new UpdateItemCommand({
                  UpdateExpression: updateExpression,
                  ConditionExpression: `attribute_not_exists(channelAssets.#${key}.#lastModified) or (channelAssets.#${key}.#lastModified < :lastModified)`,
                  Key: { id: convertToAttr(sub) },
                  ExpressionAttributeValues: {
                    ...name && { ':name': convertToAttr(name) },
                    ':previewUrl': convertToAttr(previewUrl),
                    ':lastModified': convertToAttr(
                      new Date(uploadDateTime).getTime()
                    )
                  },
                  ExpressionAttributeNames: {
                    '#url': 'url',
                    '#lastModified': 'lastModified',
                    [`#${key}`]: key
                  },
                  TableName: process.env.CHANNELS_TABLE_NAME!
                })
              );

              resolve(result);
            } catch (error) {
              reject(error);
            }
          })
        );
      } else {
        const { name: preferenceName } = value as Preference;

        return preferenceName ? [...acc, { key, value: preferenceName }] : acc;
      }

      return acc;
    }, []);

    // Update non-asset preferences
    await updateDynamoItemAttributes({
      attributes: nonAssetPreferences,
      primaryKey: { key: 'id', value: sub },
      tableName: process.env.CHANNELS_TABLE_NAME!
    });

    await Promise.all(promises);
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    return reply.send({ __type: CHANGE_USER_PREFERENCES_EXCEPTION });
  }

  return reply.send(preferences);
};

export default handler;
