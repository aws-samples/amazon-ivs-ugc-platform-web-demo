import {
  CloudWatchClient,
  GetMetricDataCommand,
  MetricDataQuery
} from '@aws-sdk/client-cloudwatch';
import { FastifyReply, FastifyRequest } from 'fastify';

import {
  alignTimeWithPeriod,
  buildChannelArn,
  getPeriodValue,
  getStreamSession
} from '../utils/metricsHelpers';
import { UNEXPECTED_EXCEPTION } from '../utils/constants';

type FormattedMetricData = {
  data: { timestamp: Date; value: number }[];
  label: string;
};

const INGEST_FRAMERATE = 'IngestFramerate';
const INGEST_VIDEO_BITRATE = 'IngestVideoBitrate';
const KEYFRAME_INTERVAL = 'KeyframeInterval';
const KEYFRAME_INTERVAL_AVG = 'KeyframeIntervalAvg';

const streamHealthMetricsNames = [
  INGEST_FRAMERATE,
  INGEST_VIDEO_BITRATE,
  KEYFRAME_INTERVAL
];

const cloudwatchClient = new CloudWatchClient({});

const handler = async (request: FastifyRequest, reply: FastifyReply) => {
  const { params } = request;
  const { channelResourceId, streamSessionId } = params as {
    channelResourceId: string;
    streamSessionId: string;
  };
  let responseBody: FormattedMetricData[];

  try {
    const { streamSession = {} } = await getStreamSession(
      buildChannelArn(channelResourceId),
      streamSessionId
    );
    const { endTime = new Date(), startTime } = streamSession;

    if (!startTime) {
      throw new Error(`Missing startTime for session: ${streamSessionId}`);
    }

    const period = getPeriodValue(startTime);
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

    metricDataQueries.push({
      Id: KEYFRAME_INTERVAL_AVG.toLowerCase(),
      Label: KEYFRAME_INTERVAL_AVG,
      // The keyframe interval average has to be returned as a time series
      Expression: `TIME_SERIES(AVG(${KEYFRAME_INTERVAL.toLowerCase()}))`
    });

    const alignedStartTimeDown = new Date(
      alignTimeWithPeriod(startTime, period, 'down') * 1000
    );
    const alignedStartTimeUp = new Date(
      alignTimeWithPeriod(startTime, period, 'up') * 1000
    );
    const alignedEndTime = new Date(
      alignTimeWithPeriod(endTime, period, 'up') * 1000
    );

    const getMetricDataCommand = new GetMetricDataCommand({
      EndTime: alignedEndTime,
      MetricDataQueries: metricDataQueries,
      StartTime:
        // If alignedStartTimeDown is in a different period threshold, fall back to alignedStartTimeUp
        // ex: startTime is 62 days and 23 hours ago and alignedStartTimeDown is 63 days ago
        getPeriodValue(alignedStartTimeDown) !== period
          ? alignedStartTimeUp
          : alignedStartTimeDown
    });
    const { MetricDataResults = [] } = await cloudwatchClient.send(
      getMetricDataCommand
    );

    let seriesLength: number;
    responseBody = MetricDataResults.reduce(
      (acc, { Label, Timestamps, Values }) => {
        if (
          !Label ||
          // We only need the keyframe interval average, not the time series
          Label === KEYFRAME_INTERVAL ||
          !Timestamps?.length ||
          !Values?.length ||
          Timestamps.length !== Values.length
        ) {
          return acc;
        }

        if (Label === KEYFRAME_INTERVAL_AVG) {
          return [
            ...acc,
            {
              // All the values in "Values" are the same here
              data: [{ timestamp: Timestamps[0], value: Values[0] }],
              label: Label
            }
          ];
        } else {
          if (!seriesLength || Timestamps.length < seriesLength) {
            seriesLength = Timestamps.length;
          }

          return [
            ...acc,
            {
              // Zip the arrays
              data: Timestamps.map((timestamp, i) => ({
                timestamp,
                value: Values[i]
                // Sort by timestamp in ascending order
              })).sort((a, b) => +a.timestamp - +b.timestamp),
              label: Label
            }
          ];
        }
      },
      [] as FormattedMetricData[]
    );

    responseBody = responseBody.map((formattedMetricData) => {
      if (formattedMetricData.label === KEYFRAME_INTERVAL_AVG) {
        return formattedMetricData;
      } else {
        return {
          ...formattedMetricData,
          // Ensure that we return metric arrays of the same size
          data: formattedMetricData.data.slice(0, seriesLength)
        };
      }
    });
  } catch (error) {
    console.error(error);

    reply.statusCode = 500;

    return reply.send({ __type: UNEXPECTED_EXCEPTION });
  }

  return reply.send(responseBody);
};

export default handler;
