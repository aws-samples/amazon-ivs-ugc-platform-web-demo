import { unmarshall } from '@aws-sdk/util-dynamodb';
import { FastifyReply, FastifyRequest } from 'fastify';

import {
  LIMIT_BREACH_EVENT_TYPE,
  SESSION_CREATED,
  SESSION_ENDED,
  UNEXPECTED_EXCEPTION
} from './constants';
import {
  AdditionalStreamAttributes,
  addStreamEventToDb,
  getStreamsByChannelArn,
  getUserByChannelArn
} from './helpers';

const handler = async (
  request: FastifyRequest<{
    Body: {
      'detail-type': string;
      detail: { event_name: string; limit_name?: string; stream_id?: string };
      time: string;
      resources: string[];
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const {
      detail: { event_name: eventName, limit_name: limitName },
      'detail-type': eventType,
      time: eventTime,
      resources
    } = request.body;
    let {
      detail: { stream_id: streamId = '' }
    } = request.body;
    const channelArn = resources?.[0];

    if ((!limitName && !eventName) || !eventType || !eventTime || !channelArn) {
      throw new Error('Missing required data for event');
    }

    const { Items } = await getUserByChannelArn(channelArn);
    let userSub;

    if (Items && Items.length > 0) {
      ({
        id: { S: userSub }
      } = Items[0]);
    } else {
      throw new Error('User not found');
    }

    if (!userSub) {
      throw new Error('Missing user sub');
    }

    if (!streamId) {
      const { Items: streamSessions = [] } = await getStreamsByChannelArn(
        channelArn
      );
      const streamSession = streamSessions.find((streamSession) => {
        const { startTime } = unmarshall(streamSession);

        if (startTime <= eventTime) return true;

        return false;
      });

      if (!streamSession) {
        throw new Error('Could not match event with a stream session');
      } else {
        streamId = streamSession.id?.S || '';
      }
    }

    const additionalAttributes: AdditionalStreamAttributes = {};

    if (eventName === SESSION_CREATED) {
      additionalAttributes.startTime = eventTime;
      additionalAttributes.hasErrorEvent = false;
    }
    if (eventName === SESSION_ENDED) additionalAttributes.endTime = eventTime;
    if (eventType === LIMIT_BREACH_EVENT_TYPE)
      additionalAttributes.hasErrorEvent = true;

    await addStreamEventToDb({
      additionalAttributes,
      channelArn,
      newEvent: {
        eventTime,
        name: limitName || eventName,
        type: eventType
      },
      streamId,
      userSub
    });
  } catch (error) {
    console.error(error);
    console.error(`Event body: ${JSON.stringify(request.body)}`);

    reply.statusCode = 500;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  return reply.send();
};

export default handler;
