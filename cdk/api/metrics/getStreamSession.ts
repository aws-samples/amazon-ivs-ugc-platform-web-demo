import {
  CloudWatchClient,
  GetMetricDataCommand,
  MetricDataQuery
} from '@aws-sdk/client-cloudwatch';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Channel, ChannelType, StreamSession } from '@aws-sdk/client-ivs';

import {
  alignTimeWithPeriod,
  buildChannelArn,
  getPeriodValue,
  getStreamSession,
  Period
} from '../utils/metricsHelpers';
import { UNEXPECTED_EXCEPTION } from '../utils/constants';

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

interface GetStreamSessionBody
  extends Omit<StreamSession, 'recordingConfiguration'> {
  channel: {
    type?: ChannelType | string;
  };
  metrics: FormattedMetricData[];
}

const INGEST_FRAMERATE = 'IngestFramerate';
const INGEST_VIDEO_BITRATE = 'IngestVideoBitrate';
const KEYFRAME_INTERVAL = 'KeyframeInterval';
const CONCURRENT_VIEWS = 'ConcurrentViews';
const streamHealthMetricsNames = [
  INGEST_FRAMERATE,
  INGEST_VIDEO_BITRATE,
  KEYFRAME_INTERVAL,
  CONCURRENT_VIEWS
];

const getMetricStatistic = (
  metricName: string,
  statistic: 'Avg' | 'Max'
): MetricDataQuery => {
  const averageMetricName = `${metricName}${statistic}`;

  return {
    Id: averageMetricName.toLowerCase(),
    Label: averageMetricName,
    // Averages have to be returned as a time series
    Expression: `TIME_SERIES(${statistic.toUpperCase()}(${metricName.toLowerCase()}))`
  };
};
const getFilledMetricSeries = (metricName: string) => {
  const filledMetricName = `${metricName}Filled`;

  return {
    Id: filledMetricName.toLowerCase(),
    Label: filledMetricName,
    Expression: `FILL(${metricName.toLowerCase()}, REPEAT)`
  };
};

const isAvgMetric = (metricName: string) => metricName.endsWith('Avg');
const isMaxMetric = (metricName: string) => metricName.endsWith('Max');
const isChartMetric = (metricName: string) =>
  [INGEST_FRAMERATE, INGEST_VIDEO_BITRATE].includes(metricName);

const cloudwatchClient = new CloudWatchClient({});

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
    const { endTime, startTime } = streamSession;
    const { channel, recordingConfiguration, ...streamSessionRest } =
      streamSession as StreamSession;
    const { type } = channel as Channel;
    const isLive = !endTime;

    if (!startTime) {
      throw new Error(`Missing startTime for session: ${streamSessionId}`);
    }

    const period = getPeriodValue(startTime);

    // Base queries to get the time series
    const metricDataQueries = streamHealthMetricsNames.reduce(
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
        const avgQuery = getMetricStatistic(streamHealthMetricsName, 'Avg');
        const maxQuery = getMetricStatistic(streamHealthMetricsName, 'Max');

        return [...queries, baseQuery, avgQuery, maxQuery];
      },
      [] as MetricDataQuery[]
    );

    // We need to fill the missing data point as these two are used for the charts
    metricDataQueries.push(getFilledMetricSeries(INGEST_FRAMERATE));
    metricDataQueries.push(getFilledMetricSeries(INGEST_VIDEO_BITRATE));

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
    // ex: startTime is 62 days and 23 hours ago and alignedStartTimeDown is 63 days ago
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
                // We only slice the array for charts metrics
                if (index >= upperValueCountBound && isChartMetric(Label))
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
