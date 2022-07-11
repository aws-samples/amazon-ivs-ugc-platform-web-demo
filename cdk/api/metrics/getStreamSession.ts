import {
  CloudWatchClient,
  GetMetricDataCommand
} from '@aws-sdk/client-cloudwatch';
import { ChannelType, StreamSession } from '@aws-sdk/client-ivs';
import { FastifyReply, FastifyRequest } from 'fastify';

import {
  alignTimeWithPeriod,
  buildChannelArn,
  buildMetricDataQueries,
  dynamoDbClient,
  formatMetricsData,
  FormattedMetricData,
  getPeriodValue,
  getStreamRecord,
  getStreamSession,
  isAvgMetric
} from './helpers';
import { SEC_PER_HOUR, UNEXPECTED_EXCEPTION } from '../shared/constants';
import { updateDynamoItemAttributes } from '../shared/helpers';

export interface GetStreamSessionBody
  extends Omit<StreamSession, 'recordingConfiguration'> {
  channel: { type?: ChannelType | string };
  metrics: FormattedMetricData[];
}

type MarshalledFormattedMetricData = FormattedMetricData & {
  alignedStartTime: string;
};

export const cloudwatchClient = new CloudWatchClient({});

const handler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { params } = request;
  const { channelResourceId, streamSessionId } = params as {
    channelResourceId: string;
    streamSessionId: string;
  };
  let responseBody: GetStreamSessionBody;

  try {
    const { streamSession = {} } = await getStreamSession(
      buildChannelArn(channelResourceId),
      streamSessionId
    );
    let { startTime } = streamSession;
    const { endTime } = streamSession;
    const {
      channel = {},
      recordingConfiguration,
      truncatedEvents,
      ...streamSessionRest
    } = streamSession;
    const isLive = !endTime;
    const { type } = channel;
    // Sort the truncated events in descending order if the stream session is live,
    // and in ascending order if the stream session is offline
    const sortedTruncatedEvents =
      truncatedEvents?.sort(
        ({ eventTime: eventTime1 }, { eventTime: eventTime2 }) => {
          /* istanbul ignore else */
          if (eventTime1 && eventTime2) {
            if (isLive) {
              return eventTime1 < eventTime2 ? 1 : -1; // Descending
            } else {
              return eventTime1 > eventTime2 ? 1 : -1; // Ascending
            }
          } else return 0; // Adding this else case for completeness, but it is extremely unlikely that 2 events have the same timestamp
        }
      ) || [];

    if (!startTime) {
      throw new Error(`Missing startTime for session: ${streamSessionId}`);
    }

    if (isLive) {
      const threeHoursAgoTimeInMs = Date.now() - SEC_PER_HOUR * 3 * 1000;

      startTime = new Date(
        // While a stream is live we return high-resolution metrics only
        // i.e.: metrics going as far back as three hours ago
        Math.max(threeHoursAgoTimeInMs, startTime.getTime())
      );
    }

    const period = getPeriodValue(startTime);
    /**
     * metricDataQueries includes:
     * - base queries to get the time series
     * - filled queries for the charts metrics
     * - average queries
     */
    const metricDataQueries = buildMetricDataQueries(channelResourceId, period);

    const alignedStartTimeDown = new Date(
      alignTimeWithPeriod(startTime, period, 'down') * 1000
    );
    const alignedStartTimeUp = new Date(
      alignTimeWithPeriod(startTime, period, 'up') * 1000
    );
    const alignedEndTime = new Date(
      alignTimeWithPeriod(endTime || new Date(), period, 'up') * 1000
    );

    // If alignedStartTimeDown is in a different period threshold, fall back to alignedStartTimeUp
    // ex: startTime is 62 days, 23 hours and 59 minutes ago and alignedStartTimeDown is 63 days ago
    const alignedStartTime =
      getPeriodValue(alignedStartTimeDown) !== period
        ? alignedStartTimeUp
        : alignedStartTimeDown;

    const { metrics = {} } = await getStreamRecord(streamSessionId);
    const metricsKey = `P${period}-S${alignedStartTime.getTime()}-E${alignedEndTime.getTime()}`;
    let marshalledFormattedMetricsData:
      | MarshalledFormattedMetricData[]
      | undefined = metrics[metricsKey];
    let formattedMetricsData: FormattedMetricData[];

    if (!isLive && marshalledFormattedMetricsData) {
      formattedMetricsData = marshalledFormattedMetricsData.map(
        (marshalledFormattedMetricData) => ({
          ...marshalledFormattedMetricData,
          alignedStartTime: new Date(
            marshalledFormattedMetricData.alignedStartTime
          )
        })
      );
    } else {
      const getMetricDataCommand = new GetMetricDataCommand({
        EndTime: alignedEndTime,
        MetricDataQueries: metricDataQueries,
        StartTime: alignedStartTime
      });
      const { MetricDataResults = [] } = await cloudwatchClient.send(
        getMetricDataCommand
      );
      const averageMetricDataResults = MetricDataResults.filter(
        ({ Label }) => Label && isAvgMetric(Label)
      );

      formattedMetricsData = formatMetricsData({
        alignedStartTime,
        averageMetricDataResults,
        isLive,
        metricDataResults: MetricDataResults,
        period
      });

      if (!isLive) {
        await updateDynamoItemAttributes({
          attributes: [
            {
              key: 'metrics',
              value: {
                [metricsKey]: formattedMetricsData.map(
                  (formattedMetricData) => ({
                    ...formattedMetricData,
                    alignedStartTime:
                      formattedMetricData.alignedStartTime.toISOString()
                  })
                )
              }
            }
          ],
          dynamoDbClient,
          id: streamSessionId,
          tableName: process.env.STREAM_TABLE_NAME as string
        });
      }
    }

    responseBody = {
      ...streamSessionRest,
      channel: { type },
      metrics: formattedMetricsData,
      truncatedEvents: sortedTruncatedEvents
    };
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  return reply.send(responseBody);
};

export default handler;
