import { FastifyReply, FastifyRequest } from 'fastify';
import axios from 'axios';

import {
  APPSYNC_EVENT_TYPES,
  UNEXPECTED_EXCEPTION
} from '../../shared/constants';
import { getSecrets } from '../../shared/helpers';

type RevokeStageRequestMessageRequestBody = {
  receiverChannelId?: string;
  senderChannelId?: string;
};

const handler = async (
  request: FastifyRequest<{ Body: RevokeStageRequestMessageRequestBody }>,
  reply: FastifyReply
) => {
  let receiverChannelId, senderChannelId;

  // From Beacon API (JSON string)
  if (typeof request.body === 'string') {
    const parsedBody = JSON.parse(request?.body);
    const receiverId = parsedBody?.receiverChannelId;
    const senderId = parsedBody?.senderChannelId;

    if (receiverId) receiverChannelId = receiverId;
    if (senderId) senderChannelId = senderId;
  }

  if (!receiverChannelId || !senderChannelId)
    throw new Error(
      'A sender and receiver id is required in order to revoke a stage request'
    );

  try {
    const secretName = process.env.APPSYNC_GRAPHQL_API_SECRET_NAME as string;
    const appSyncGraphQlApiSecrets = await getSecrets(secretName);

    const body = {
      query: `
        mutation Publish($name: String!, $data: AWSJSON!) {
          publish(name: $name, data: $data) {
            name
            data
          }
        }
      `,
      variables: {
        name: receiverChannelId,
        data: JSON.stringify({
          type: APPSYNC_EVENT_TYPES.STAGE_REVOKE_REQUEST_TO_JOIN,
          channelId: senderChannelId
        })
      }
    };

    await axios.post(appSyncGraphQlApiSecrets.graphQlApiEndpoint, body, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': appSyncGraphQlApiSecrets.apiKey
      }
    });

    reply.statusCode = 200;
    return reply.send({
      message: `${APPSYNC_EVENT_TYPES.STAGE_REVOKE_REQUEST_TO_JOIN} message has been published to channel: ${receiverChannelId}`
    });
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;
    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }
};

export default handler;
