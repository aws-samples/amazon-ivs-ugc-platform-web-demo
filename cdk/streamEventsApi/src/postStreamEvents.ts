import { unmarshall } from '@aws-sdk/util-dynamodb';
import { FastifyReply, FastifyRequest } from 'fastify';

import {
  LIMIT_BREACH_EVENT_TYPE,
  SESSION_CREATED,
  SESSION_ENDED,
  STARVATION_START,
  STREAM_END,
  STREAM_HEALTH_CHANGE_EVENT_TYPE,
  UNEXPECTED_EXCEPTION
} from './constants';
import {
  AdditionalStreamAttributes,
  getStreamEvents,
  getStreamsByChannelArn,
  setOldLiveStreamsOffline,
  StreamEvent,
  updateStreamEvents
} from './helpers';
import { getUserByChannelArn } from './helpers';

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

    // Ignore "AWS API Call via CloudTrail" events
    if (eventType === 'AWS API Call via CloudTrail') {
      return;
    }

    console.info('Incoming Event', JSON.stringify(request.body));

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
      ({ id: userSub } = unmarshall(Items[0]));
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

        return startTime <= eventTime;
      });

      if (!streamSession) {
        throw new Error('Could not match event with a stream session');
      } else {
        streamId = streamSession.id?.S || '';
      }
    }

    const newEvent: StreamEvent = {
      eventTime,
      name: limitName || eventName,
      type: eventType
    };
    const streamEvents = await getStreamEvents(channelArn, streamId);
    streamEvents.push(newEvent);
    const sortedStreamEvents =
      streamEvents.sort(
        ({ eventTime: eventTime1 }, { eventTime: eventTime2 }) => {
          /* istanbul ignore else */
          if (eventTime1 === eventTime2) {
            return 0; // Adding this else case for completeness, but it is extremely unlikely that 2 events have the same timestamp
          } else {
            return eventTime1 > eventTime2 ? 1 : -1; // Ascending order
          }
        }
      ) || [];
    const latestStreamHealthChangeEvent = sortedStreamEvents
      .filter(({ type }) => type === STREAM_HEALTH_CHANGE_EVENT_TYPE)
      .pop();

    const additionalAttributes: AdditionalStreamAttributes = {};
    const attributesToRemove: string[] = [];

    additionalAttributes.isHealthy =
      latestStreamHealthChangeEvent?.name !== STARVATION_START;

    if (eventName === SESSION_CREATED) {
      // Older stream sessions with isOpen set to true will have the isOpen attribute removed
      await setOldLiveStreamsOffline(channelArn);

      additionalAttributes.startTime = eventTime;

      // Handle the case where a SESSION_CREATED event is dispatched after a SESSION_ENDED or STREAM_END event
      if (
        streamEvents.some(
          (streamEvent) =>
            streamEvent.name === SESSION_ENDED ||
            streamEvent.name === STREAM_END
        )
      ) {
        console.log(
          'Session not set to live: a SESSION_ENDED or STREAM_END event was already detected. Stream ID: ',
          streamId
        );
      } else {
        additionalAttributes.hasErrorEvent = false;
        additionalAttributes.isOpen = 'true';
      }
    } else if (eventName === SESSION_ENDED) {
      additionalAttributes.endTime = eventTime;
      attributesToRemove.push('isOpen');
    }
    if (eventType === LIMIT_BREACH_EVENT_TYPE)
      additionalAttributes.hasErrorEvent = true;

    await updateStreamEvents({
      additionalAttributes,
      attributesToRemove,
      channelArn,
      streamEvents,
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
