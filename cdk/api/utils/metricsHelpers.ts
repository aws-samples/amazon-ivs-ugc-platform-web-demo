import { GetStreamSessionCommand, IvsClient } from '@aws-sdk/client-ivs';

const ivsClient = new IvsClient({});
const SEC_PER_HOUR = 3600;
const SEC_PER_DAY = SEC_PER_HOUR * 24;

export type Period = 3600 | 300 | 60 | 5;

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
