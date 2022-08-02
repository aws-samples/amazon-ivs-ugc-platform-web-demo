import { FastifyReply, FastifyRequest } from 'fastify';

import { CHANGE_USER_PREFERENCES_EXCEPTION } from '../../shared/constants';
import { ResponseBody, updateDynamoItemAttributes } from '../../shared/helpers';
import { UserContext } from '../authorizer';

interface ChangeUserPreferencesRequestBody {
  avatar?: string;
  color?: string;
}

interface ChangeUserPreferencesResponseBody extends ResponseBody {
  avatar?: string;
  color?: string;
}

const handler = async (
  request: FastifyRequest<{ Body: ChangeUserPreferencesRequestBody }>,
  reply: FastifyReply
) => {
  const { sub, username } = request.requestContext.get('user') as UserContext;
  const preferencesToUpdate = Object.entries(request.body).reduce(
    (preferences: { key: string; value: string }[], [key, value]) =>
      !!value ? [...preferences, { key, value }] : preferences,
    []
  );

  try {
    if (!preferencesToUpdate.length) {
      throw new Error(`Missing new user preferences for user: ${username}`);
    }

    // Update Dynamo user entry
    await updateDynamoItemAttributes({
      attributes: preferencesToUpdate,
      primaryKey: { key: 'id', value: sub },
      tableName: process.env.USER_TABLE_NAME as string
    });
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    return reply.send({ __type: CHANGE_USER_PREFERENCES_EXCEPTION });
  }

  const responseBody: ChangeUserPreferencesResponseBody =
    preferencesToUpdate.reduce(
      (updatedPrefs, { key, value }) => ({ ...updatedPrefs, [key]: value }),
      {}
    );

  return reply.send(responseBody);
};

export default handler;
