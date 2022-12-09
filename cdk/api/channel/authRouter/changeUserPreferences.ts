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
  name: string;
  [key: string]: any;
}

interface AvatarPreference extends Preference {
  previewUrl?: string;
  uploadDateTime?: string;
}
interface ColorPreference extends Preference {}

interface ChangeUserPreferencesRequestBody {
  avatar?: AvatarPreference;
  color?: ColorPreference;
}

const CUSTOM_AVATAR_NAME = 'custom';

const handler = async (
  request: FastifyRequest<{ Body: ChangeUserPreferencesRequestBody }>,
  reply: FastifyReply
) => {
  const { sub, username } = request.requestContext.get('user') as UserContext;

  const preferencesToUpdate = Object.entries(request.body).reduce<
    Record<string, Preference>
  >(
    (preferences, [key, value]) =>
      !!value?.name ? { ...preferences, [key]: value } : preferences,
    {}
  );

  if (!Object.keys(preferencesToUpdate).length) {
    throw new Error(`Missing new user preferences for user: ${username}`);
  }

  try {
    const promises: Promise<UpdateItemCommandOutput | undefined>[] = [];
    const remainingPreferencesToUpdate = Object.entries(
      preferencesToUpdate
    ).reduce<{ key: string; value: any }[]>((acc, [key, value]) => {
      if (!value) return acc;

      switch (key) {
        case 'avatar': {
          const {
            name: avatarName,
            previewUrl,
            uploadDateTime
          } = value as AvatarPreference;

          if (
            avatarName === CUSTOM_AVATAR_NAME &&
            previewUrl &&
            uploadDateTime
          ) {
            promises.push(
              new Promise<UpdateItemCommandOutput>(async (resolve, reject) => {
                try {
                  await dynamoDbClient.send(
                    new UpdateItemCommand({
                      UpdateExpression: `SET channelAssets.avatar = if_not_exists(channelAssets.avatar, :emptyMap)`,
                      Key: { id: convertToAttr(sub) },
                      ExpressionAttributeValues: {
                        ':emptyMap': convertToAttr({})
                      },
                      TableName: process.env.CHANNELS_TABLE_NAME!
                    })
                  );

                  const updateExpression = `SET ${[
                    'avatar = :avatarName',
                    'channelAssets.avatar.#url = :previewUrl',
                    'channelAssets.avatar.#lastModified = :lastModified'
                  ].join(', ')}`;

                  const result = dynamoDbClient.send(
                    new UpdateItemCommand({
                      UpdateExpression: updateExpression,
                      ConditionExpression:
                        'attribute_not_exists(channelAssets.avatar.#lastModified) or (channelAssets.avatar.#lastModified < :lastModified)',
                      Key: { id: convertToAttr(sub) },
                      ExpressionAttributeValues: {
                        ':avatarName': convertToAttr(avatarName),
                        ':previewUrl': convertToAttr(previewUrl),
                        ':lastModified': convertToAttr(
                          new Date(uploadDateTime).getTime()
                        )
                      },
                      ExpressionAttributeNames: {
                        '#url': 'url',
                        '#lastModified': 'lastModified'
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
            return [...acc, { key, value: avatarName }];
          }
          break;
        }
        default: {
          const { name: preferenceName } = value as Preference;

          return [...acc, { key, value: preferenceName }];
        }
      }

      return acc;
    }, []);

    if (remainingPreferencesToUpdate) {
      // Update Dynamo user entry
      await updateDynamoItemAttributes({
        attributes: remainingPreferencesToUpdate,
        primaryKey: { key: 'id', value: sub },
        tableName: process.env.CHANNELS_TABLE_NAME!
      });
    }

    await Promise.all(promises);
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    return reply.send({ __type: CHANGE_USER_PREFERENCES_EXCEPTION });
  }

  return reply.send(preferencesToUpdate);
};

export default handler;
