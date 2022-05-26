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

const getMetricAverage = (metricName: string) => {
  const averageMetricName = `${metricName}Avg`;

  return {
    Id: averageMetricName.toLowerCase(),
    Label: averageMetricName,
    // Averages have to be returned as a time series
    Expression: `TIME_SERIES(AVG(${metricName.toLowerCase()}))`
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
    const metricDataQueries: MetricDataQuery[] = streamHealthMetricsNames.map(
      (streamHealthMetricsName) => ({
        Id: streamHealthMetricsName.toLowerCase(),
        MetricStat: {
          Metric: {
            Dimensions: [{ Name: 'Channel', Value: channelResourceId }],
            MetricName: streamHealthMetricsName,
            Namespace: 'AWS/IVS'
          },
          Period: period,
          Stat: 'Average'
        }
      })
    );

    metricDataQueries.push(getMetricAverage(KEYFRAME_INTERVAL));
    // We only need the concurrent views average if the stream is offline
    if (!isLive) {
      metricDataQueries.push(getMetricAverage(CONCURRENT_VIEWS));
    }

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

    const formattedMetricsData = MetricDataResults.reduce(
      (acc, { Label, Timestamps, Values }) => {
        if (
          !Label ||
          // We need the keyframe interval average, not the time series
          // We need the filled time series for the charts metrics
          [KEYFRAME_INTERVAL, INGEST_FRAMERATE, INGEST_VIDEO_BITRATE].includes(
            Label
          ) ||
          // If the stream is offline, we need the concurrent views average, not the time series
          (Label === CONCURRENT_VIEWS && !isLive) ||
          // If the stream is live, we need the concurrent views, not the average
          (Label === `${CONCURRENT_VIEWS}Avg` && isLive) ||
          !Timestamps?.length ||
          !Values?.length ||
          Timestamps.length !== Values.length
        ) {
          return acc;
        }

        if (isAvgMetric(Label)) {
          return [
            ...acc,
            {
              alignedStartTime,
              // All the values in "Values" are the same here
              data: [Values[0]],
              label: Label,
              period
            }
          ];
        } else {
          return [
            ...acc,
            {
              alignedStartTime,
              // Zip the arrays
              data: Timestamps.map((timestamp, i) => ({
                timestamp,
                value: Values[i]
                // Sort by timestamp in ascending order
              }))
                .sort((a, b) => +a.timestamp - +b.timestamp)
                .map(({ value }) => value),
              label: Label.replace('Filled', ''),
              period
            }
          ];
        }
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
