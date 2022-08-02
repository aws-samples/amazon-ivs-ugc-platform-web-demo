import { GetMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import {
  ChannelType,
  IngestConfiguration,
  StreamEvent
} from '@aws-sdk/client-ivs';
import { FastifyReply, FastifyRequest } from 'fastify';

import {
  alignTimeWithPeriod,
  buildChannelArn,
  buildMetricDataQueries,
  formatMetricsData,
  FormattedMetricData,
  getPeriodValue,
  getStreamSessionDbRecord,
  isAvgMetric
} from './helpers';
import { SEC_PER_HOUR, UNEXPECTED_EXCEPTION } from '../shared/constants';
import {
  cloudwatchClient,
  updateDynamoItemAttributes,
  updateIngestConfiguration
} from '../shared/helpers';
import { UserContext } from '../userManagement/authorizer';

export interface GetStreamSessionResponseBody {
  channel: { type: ChannelType };
  endTime?: Date;
  streamId?: string;
  ingestConfiguration?: IngestConfiguration;
  metrics: FormattedMetricData[];
  startTime?: Date;
  truncatedEvents?: StreamEvent[];
}

const handler = async (
  request: FastifyRequest<{
    Params: {
      channelResourceId: string;
      streamSessionId: string;
    };
  }>,
  reply: FastifyReply
) => {
  const { sub } = request.requestContext.get('user') as UserContext;
  const { params } = request;
  const { channelResourceId, streamSessionId } = params;
  let responseBody: GetStreamSessionResponseBody;
  const channelArn = buildChannelArn(channelResourceId);

  try {
    const streamSession = await getStreamSessionDbRecord(
      channelArn,
      streamSessionId
    );
    let { ingestConfiguration, startTime } = streamSession;
    const {
      endTime,
      id: streamId,
      metrics = {},
      userSub,
      truncatedEvents
    } = streamSession;
    const isLive = !endTime;

    if (sub !== userSub)
      throw new Error('User trying to access session from a different channel');

    if (!startTime) {
      throw new Error(`Missing startTime for session: ${streamSessionId}`);
    }

    if (!ingestConfiguration) {
      try {
        ingestConfiguration = await updateIngestConfiguration({
          channelArn,
          streamSessionId
        });
      } catch (error) {
        // Missing ingest configuration or failed attempts to retrieve this data shouldn't stop the flow
      }
    }

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

    const metricsKey = `P${period}-S${alignedStartTime.getTime()}-E${alignedEndTime.getTime()}`;
    let marshalledFormattedMetricsData = metrics[metricsKey];
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
          primaryKey: { key: 'channelArn', value: channelArn },
          sortKey: { key: 'id', value: streamSessionId },
          tableName: process.env.STREAM_TABLE_NAME as string
        });
      }
    }

    responseBody = {
      channel: { type: process.env.IVS_CHANNEL_TYPE as ChannelType },
      endTime,
      ingestConfiguration,
      metrics: formattedMetricsData,
      startTime,
      streamId,
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
