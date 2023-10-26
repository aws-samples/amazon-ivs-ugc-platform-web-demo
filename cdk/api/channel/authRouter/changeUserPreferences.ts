import { UpdateItemCommandOutput } from '@aws-sdk/client-dynamodb';
import { FastifyReply, FastifyRequest } from 'fastify';

import { CHANGE_USER_PREFERENCES_EXCEPTION } from '../../shared/constants';
import { updateDynamoItemAttributes } from '../../shared/helpers';
import { processAssetPreference, Preference } from '../helpers';
import { UserContext } from '../../shared/authorizer';

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
    const nonAssetPreferences = Object.entries(preferences).reduce<
      { key: string; value: any }[]
    >((acc, [key, value]) => {
      if (!value) return acc;

      const { previewUrl, uploadDateTime } = value;
      const isAsset = !!previewUrl && !!uploadDateTime;

      if ((previewUrl && !uploadDateTime) || (!previewUrl && uploadDateTime)) {
        const missingKey = !previewUrl ? 'previewUrl' : 'uploadDateTime';

        throw new Error(
          `${missingKey} is missing from the asset preference data`
        );
      }

      if (isAsset) {
        const assetToProcess = processAssetPreference(key, value, sub);
        promises.push(assetToProcess);
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
