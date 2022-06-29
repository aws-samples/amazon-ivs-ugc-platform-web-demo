import {
  CloudWatchClient,
  GetMetricDataCommand,
  MetricDataQuery
} from '@aws-sdk/client-cloudwatch';
import { ChannelType, StreamSession } from '@aws-sdk/client-ivs';
import { FastifyReply, FastifyRequest } from 'fastify';

import {
  alignTimeWithPeriod,
  buildChannelArn,
  buildFilledMetricQuery,
  buildMetricStatisticQuery,
  getPeriodValue,
  getStreamSession,
  isAvgMetric,
  isChartMetric,
  isMaxMetric,
  Period
} from './helpers';
import {
  INGEST_FRAMERATE,
  INGEST_VIDEO_BITRATE,
  SEC_PER_HOUR,
  STREAM_HEALTH_METRICS_NAMES,
  UNEXPECTED_EXCEPTION
} from '../utils/constants';

type FormattedMetricData = {
  alignedStartTime: Date;
  data: number[];
  label: string;
  period: Period;
  statistics: {
    average?: number;
    maximum?: number;
  };
};

export interface GetStreamSessionBody
  extends Omit<StreamSession, 'recordingConfiguration'> {
  channel: {
    type?: ChannelType | string;
  };
  metrics: FormattedMetricData[];
}

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
      ...streamSessionRest
    } = streamSession;
    const { type } = channel;
    const isLive = !endTime;

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

    // Base queries to get the time series
    const metricDataQueries = STREAM_HEALTH_METRICS_NAMES.reduce(
      (queries, streamHealthMetricsName) => {
        const baseQuery: MetricDataQuery = {
          Id: streamHealthMetricsName.toLowerCase(),
          Label: streamHealthMetricsName,
          MetricStat: {
            Metric: {
              Dimensions: [{ Name: 'Channel', Value: channelResourceId }],
              MetricName: streamHealthMetricsName,
              Namespace: 'AWS/IVS'
            },
            Period: period,
            Stat: 'Average'
          }
        };
        const avgQuery = buildMetricStatisticQuery(
          streamHealthMetricsName,
          'Avg'
        );
        const maxQuery = buildMetricStatisticQuery(
          streamHealthMetricsName,
          'Max'
        );

        return [...queries, baseQuery, avgQuery, maxQuery];
      },
      [] as MetricDataQuery[]
    );

    // We need to fill the missing data point as these two are used for the charts
    metricDataQueries.push(buildFilledMetricQuery(INGEST_FRAMERATE));
    metricDataQueries.push(buildFilledMetricQuery(INGEST_VIDEO_BITRATE));

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
    const maximumMetricDataResults = MetricDataResults.filter(
      ({ Label }) => Label && isMaxMetric(Label)
    );

    const formattedMetricsData = MetricDataResults.reduce(
      (acc, { Label, Timestamps, Values }) => {
        if (
          !Label ||
          // We need the keyframe interval average, not the time series
          // We need the filled time series for the charts metrics
          isChartMetric(Label) ||
          isAvgMetric(Label) ||
          isMaxMetric(Label) ||
          !Timestamps?.length ||
          !Values?.length ||
          Timestamps.length !== Values.length
        ) {
          return acc;
        }

        const deleteCount = Math.round(30 / period);
        const upperValueCountBound = Timestamps.length - deleteCount;
        const cleanedLabel = Label.replace('Filled', '');

        return [
          ...acc,
          {
            alignedStartTime,
            // Zip the arrays
            data: Timestamps.map((timestamp, i) => ({
              timestamp,
              value: Values[i]
            }))
              // Sort by timestamp in ascending order
              .sort((a, b) => +a.timestamp - +b.timestamp)
              .reduce((metricValues, { value }, index) => {
                /**
                 * For live streams, there is a ~30sec delay for the metrics to be populated.
                 * So we slice the last 30sec of the metrics array to avoid showing filled values.
                 * For a recently ended stream, the offline stream summary may contain pre-filled data values at the end of the dataset,
                 * until CloudWatch receives one last update
                 */
                if (
                  isLive &&
                  index >= upperValueCountBound &&
                  isChartMetric(cleanedLabel)
                )
                  return metricValues;
                return [...metricValues, value];
              }, [] as number[]),
            label: cleanedLabel,
            period,
            statistics: {
              average: averageMetricDataResults.find(
                (averageMetricDataResult) =>
                  averageMetricDataResult.Label!.includes(cleanedLabel)
              )?.Values?.[0],
              maximum: maximumMetricDataResults.find(
                (maximumMetricDataResult) =>
                  maximumMetricDataResult.Label!.includes(cleanedLabel)
              )?.Values?.[0]
            }
          }
        ];
      },
      [] as FormattedMetricData[]
    );

    responseBody = {
      ...streamSessionRest,
      channel: { type },
      metrics: formattedMetricsData
    };
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  return reply.send(responseBody);
};

export default handler;
