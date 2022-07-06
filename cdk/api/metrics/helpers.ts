import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { GetStreamSessionCommand, IvsClient } from '@aws-sdk/client-ivs';
import { MetricDataQuery, MetricDataResult } from '@aws-sdk/client-cloudwatch';
import { unmarshall } from '@aws-sdk/util-dynamodb';

import {
  INGEST_FRAMERATE,
  INGEST_VIDEO_BITRATE,
  SEC_PER_DAY,
  SEC_PER_HOUR,
  STREAM_HEALTH_METRICS_NAMES
} from '../shared/constants';

export const ivsClient = new IvsClient({});
export const dynamoDbClient = new DynamoDBClient({});

export type Period = 3600 | 300 | 60 | 5;

export type FormattedMetricData = {
  alignedStartTime: Date;
  data: number[];
  label: string;
  period: Period;
  statistics: {
    average?: number;
  };
};

export const getStreamRecord = async (streamId: string) => {
  const getItemCommand = new GetItemCommand({
    Key: { id: { S: streamId } },
    TableName: process.env.STREAM_TABLE_NAME
  });
  const { Item = {} } = await dynamoDbClient.send(getItemCommand);

  return unmarshall(Item);
};

export const buildChannelArn = (resourceId: string) =>
  `arn:aws:ivs:${process.env.REGION}:${process.env.ACCOUNT_ID}:channel/${resourceId}`;

/**
 * This function helps us get the correct period value based on the provided start time
 * See documentation for reference: https://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/API_GetMetricData.html
 * @param startTime
 * @returns period
 */
export const getPeriodValue = (startTime: Date): Period => {
  const nowInSec = Date.now() / 1000;
  const startTimeInSec = startTime.getTime() / 1000;
  const diff = Math.ceil(nowInSec - startTimeInSec);

  if (diff > 63 * SEC_PER_DAY) {
    return 3600; // Start time greater than 63 days ago - use a period of 3600 seconds (1 hour)
  } else if (diff > 15 * SEC_PER_DAY) {
    return 300; // Start time between 15 and 63 days ago - use a period of 300 seconds (5 minutes)
  } else if (diff > 3 * SEC_PER_HOUR) {
    return 60; // Start time between 3 hours and 15 days ago - use a period of 60 seconds (1 minute)
  } else {
    return 5; // Start time within the past 3 hours - use a period of 5 seconds for high-resolution metrics
  }
};

/**
 * For performance purposes, Cloudwatch requires that the start and end time provided in a query align with the time period.
 * For example, if the Period of a metric is 5 minutes, specifying 12:05 or 12:30 as EndTime can get a faster response from CloudWatch than setting 12:07 or 12:29 as the EndTime.
 * @param time
 * @param period
 * @param alignmentType
 * @returns alignedTime
 */
export const alignTimeWithPeriod = (
  time: Date,
  period: Period,
  alignmentType: 'up' | 'down'
) => {
  const timeInSec = time.getTime() / 1000;

  if (alignmentType === 'up') {
    return period * Math.ceil(timeInSec / period);
  } else {
    return period * Math.floor(timeInSec / period);
  }
};

export const getStreamSession = (
  channelArn: string,
  streamSessionId: string
) => {
  const getStreamSessionCommand = new GetStreamSessionCommand({
    channelArn,
    streamId: streamSessionId
  });

  return ivsClient.send(getStreamSessionCommand);
};

export const isAvgMetric = (metricName: string) => metricName.endsWith('Avg');
export const isChartMetric = (metricName: string) =>
  [INGEST_FRAMERATE, INGEST_VIDEO_BITRATE].includes(metricName);

export const buildMetricStatisticQuery = (
  metricName: string,
  statistic: 'Avg'
): MetricDataQuery => {
  const averageMetricName = `${metricName}${statistic}`;

  return {
    Id: averageMetricName.toLowerCase(),
    Label: averageMetricName,
    // Averages have to be returned as a time series
    Expression: `TIME_SERIES(${statistic.toUpperCase()}(${metricName.toLowerCase()}))`
  };
};
export const buildFilledMetricQuery = (metricName: string): MetricDataQuery => {
  const filledMetricName = `${metricName}Filled`;

  return {
    Id: filledMetricName.toLowerCase(),
    Label: filledMetricName,
    Expression: `FILL(${metricName.toLowerCase()}, REPEAT)`
  };
};
export const buildMetricDataQueries = (
  channelResourceId: string,
  period: Period
) =>
  STREAM_HEALTH_METRICS_NAMES.reduce((queries, streamHealthMetricsName) => {
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
    const avgQuery = buildMetricStatisticQuery(streamHealthMetricsName, 'Avg');

    let filledQuery: MetricDataQuery[] = [];
    // We need to fill the missing data point for metrics that are used for the charts
    if (isChartMetric(streamHealthMetricsName)) {
      filledQuery = [buildFilledMetricQuery(streamHealthMetricsName)];
    }

    return [...queries, baseQuery, avgQuery, ...filledQuery];
  }, [] as MetricDataQuery[]);

export const formatMetricsData = ({
  alignedStartTime,
  averageMetricDataResults,
  isLive,
  metricDataResults,
  period
}: {
  alignedStartTime: Date;
  averageMetricDataResults: MetricDataResult[];
  isLive: boolean;
  metricDataResults: MetricDataResult[];
  period: Period;
}) =>
  metricDataResults.reduce((acc, { Label, Timestamps, Values }) => {
    if (
      !Label ||
      // We need the keyframe interval average, not the time series
      // We need the filled time series for the charts metrics
      isChartMetric(Label) ||
      isAvgMetric(Label) ||
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
          average: averageMetricDataResults.find((averageMetricDataResult) =>
            averageMetricDataResult.Label!.includes(cleanedLabel)
          )?.Values?.[0]
        }
      }
    ];
  }, [] as FormattedMetricData[]);
