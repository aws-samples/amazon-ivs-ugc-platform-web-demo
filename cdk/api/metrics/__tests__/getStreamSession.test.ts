import {
  GetMetricDataCommand,
  MetricDataResult
} from '@aws-sdk/client-cloudwatch';
import { GetStreamSessionCommand } from '@aws-sdk/client-ivs';
import { mockClient } from 'aws-sdk-client-mock';

import {
  createRouteAuthenticationTests,
  injectAuthorizedRequest
} from '../../testUtils';
import {
  INGEST_FRAMERATE,
  INGEST_VIDEO_BITRATE,
  UNEXPECTED_EXCEPTION
} from '../../utils/constants';
import { cloudwatchClient, GetStreamSessionBody } from '../getStreamSession';
import { ivsClient } from '../helpers';
import buildServer from '../../buildServer';
import metricDataResultsJsonMock from '../../__mocks__/metricDataResults.json';
import streamSessionMock from '../../__mocks__/streamSession.json';

const metricDataResultsMock = metricDataResultsJsonMock.map(
  (metricDataResult) => ({
    ...metricDataResult,
    Timestamps: metricDataResult.Timestamps.map(
      (timestamp) => new Date(timestamp)
    )
  })
);
const mockIvsClient = mockClient(ivsClient);
const mockCloudwatchClient = mockClient(cloudwatchClient);
const route = '/metrics/channelResourceId/streamSessions/streamSessionId';
const mockNow = new Date('2022-06-10T19:12:05.000Z');
const mockNowTimestamp = mockNow.getTime();
const mockDefaultStartTime = new Date('2022-06-10T19:07:00.000Z');

describe('getStreamSession controller', () => {
  const server = buildServer();
  const mockConsoleError = jest.fn();

  const RealDate = Date;
  const realDateNow = Date.now.bind(global.Date);

  beforeAll(() => {
    console.error = mockConsoleError;

    /**
     * The Date constructor will return the mockNow date when called without argument.
     * When called with an argument, it will behave like the real Date constructor.
     */
    (global as any).Date = class extends RealDate {
      constructor(arg: any) {
        super();

        if (arg) return new RealDate(arg);

        return mockNow;
      }
    };
    global.Date.now = jest.fn(() => mockNowTimestamp);
  });

  afterAll(() => {
    global.Date = RealDate;
    global.Date.now = realDateNow;
  });

  beforeEach(() => {
    mockIvsClient.reset();
    mockIvsClient.on(GetStreamSessionCommand).resolves({
      streamSession: {
        ...streamSessionMock,
        startTime: mockDefaultStartTime
      }
    });

    mockCloudwatchClient.reset();
    mockCloudwatchClient.on(GetMetricDataCommand).resolves({});
  });

  createRouteAuthenticationTests(server, route);

  it('should return an unexpected exception when the IVS client fails', async () => {
    mockIvsClient.on(GetStreamSessionCommand).rejects({});

    const response = await injectAuthorizedRequest(server, { url: route });
    const { __type } = JSON.parse(response.payload);

    expect(mockConsoleError).toHaveBeenCalledTimes(1);
    expect(response.statusCode).toBe(500);
    expect(__type).toBe(UNEXPECTED_EXCEPTION);
  });

  it('should return an unexpected exception when the startTime is missing', async () => {
    mockIvsClient.on(GetStreamSessionCommand).resolves({});

    const response = await injectAuthorizedRequest(server, { url: route });
    const { __type } = JSON.parse(response.payload);

    expect(mockConsoleError.mock.lastCall[0].message).toBe(
      'Missing startTime for session: streamSessionId'
    );
    expect(response.statusCode).toBe(500);
    expect(__type).toBe(UNEXPECTED_EXCEPTION);
  });

  it('should return the correct metrics for a live stream less than 3 hours long', async () => {
    mockCloudwatchClient.callsFakeOnce(({ StartTime, EndTime }) => {
      if (
        // This condition helps us test the time alignment logic
        StartTime.toISOString() === mockDefaultStartTime.toISOString() &&
        EndTime.toISOString() === mockNow.toISOString()
      ) {
        return { MetricDataResults: metricDataResultsMock };
      }

      throw new Error('Wrong input');
    });

    const response = await injectAuthorizedRequest(server, { url: route });
    const { metrics, ...rest } = JSON.parse(
      response.payload
    ) as GetStreamSessionBody;
    const ingestFramerateMetric = metrics.find(
      ({ label }) => label === INGEST_FRAMERATE
    );

    expect(rest).toMatchObject(streamSessionMock);
    expect(response.statusCode).toBe(200);
    expect(metrics.length).toBe(4);
    expect(metrics).toMatchSnapshot();
    expect(ingestFramerateMetric!.data.length).toBe(56);
  });

  it('should return the correct metrics for an offline stream less than 3 hours long', async () => {
    mockIvsClient.on(GetStreamSessionCommand).resolves({
      streamSession: {
        ...streamSessionMock,
        startTime: mockDefaultStartTime,
        endTime: mockNow
      }
    });
    mockCloudwatchClient.callsFakeOnce(({ StartTime, EndTime }) => {
      if (
        // This condition helps us test the time alignment logic
        StartTime.toISOString() === mockDefaultStartTime.toISOString() &&
        EndTime.toISOString() === mockNow.toISOString()
      ) {
        return { MetricDataResults: metricDataResultsMock };
      }

      throw new Error('Wrong input');
    });

    const response = await injectAuthorizedRequest(server, { url: route });
    const { metrics, ...rest } = JSON.parse(
      response.payload
    ) as GetStreamSessionBody;
    const ingestFramerateMetric = metrics.find(
      ({ label }) => label === INGEST_FRAMERATE
    );

    expect(rest).toMatchObject(streamSessionMock);
    expect(response.statusCode).toBe(200);
    expect(metrics.length).toBe(4);
    expect(metrics).toMatchSnapshot();
    expect(ingestFramerateMetric!.data.length).toBe(62);
  });

  it('should return the correct alignedStartTime for an offline stream started 62 days, 23 hours and 59 minutes ago', async () => {
    /**
     * Given the following startTime: 2022-04-08T19:13:00.000Z,
     * if we were to align the start time down it would be 2022-04-08T19:10:00.000Z.
     * This would not work as the aligned start time would now fall in the next threshold of 63 days (63 days and 2 minutes ago),
     * so we expect the start time to be aligned up (2022-04-08T19:15:00.000Z).
     */
    const mockStartTime = new Date('2022-04-08T19:13:00.000Z');
    const mockEndTime = new Date('2022-04-08T19:18:05.000Z');
    mockIvsClient.on(GetStreamSessionCommand).resolves({
      streamSession: {
        ...streamSessionMock,
        startTime: mockStartTime,
        endTime: mockEndTime
      }
    });
    const expectedStartTime = new Date('2022-04-08T19:15:00.000Z');
    const expectedEndTime = new Date('2022-04-08T19:20:00.000Z');
    mockCloudwatchClient.callsFakeOnce(({ StartTime, EndTime }) => {
      if (
        // This condition helps us test the time alignment logic
        StartTime.toISOString() === expectedStartTime.toISOString() &&
        EndTime.toISOString() === expectedEndTime.toISOString()
      ) {
        return { MetricDataResults: metricDataResultsMock };
      }

      throw new Error('Wrong input');
    });

    const response = await injectAuthorizedRequest(server, { url: route });
    const { metrics, ...rest } = JSON.parse(response.payload);

    expect(rest).toMatchObject(streamSessionMock);
    expect(response.statusCode).toBe(200);
    expect(metrics.length).toBe(4);
  });

  it('should return empty metrics if CloudWatch returns empty metrics', async () => {
    const response = await injectAuthorizedRequest(server, { url: route });
    const { metrics, ...rest } = JSON.parse(response.payload);

    expect(rest).toMatchObject(streamSessionMock);
    expect(response.statusCode).toBe(200);
    expect(metrics.length).toBe(0);
  });

  it('should handle missing Timestamps or missing Values in the charts metrics and return a partial response', async () => {
    mockCloudwatchClient.on(GetMetricDataCommand).resolves({
      MetricDataResults: metricDataResultsMock.reduce(
        (acc, metricDataResult) => {
          if (metricDataResult.Label === `${INGEST_FRAMERATE}Filled`)
            return [...acc, { ...metricDataResult, Timestamps: undefined }];
          if (metricDataResult.Label === `${INGEST_VIDEO_BITRATE}Filled`)
            return [...acc, { ...metricDataResult, Values: undefined }];
          return [...acc, metricDataResult];
        },
        [] as MetricDataResult[]
      )
    });

    const response = await injectAuthorizedRequest(server, { url: route });
    const { metrics, ...rest } = JSON.parse(response.payload);

    expect(rest).toMatchObject(streamSessionMock);
    expect(response.statusCode).toBe(200);
    expect(metrics.length).toBe(2);
    expect(metrics).toMatchSnapshot();
  });

  it('should handle missing Values in the statistics metrics and return partial statistics', async () => {
    mockCloudwatchClient.on(GetMetricDataCommand).resolves({
      MetricDataResults: metricDataResultsMock.reduce(
        (acc, metricDataResult) => {
          if (metricDataResult.Label === `${INGEST_FRAMERATE}Avg`)
            return [...acc, { ...metricDataResult, Values: undefined }];
          if (metricDataResult.Label === `${INGEST_VIDEO_BITRATE}Max`)
            return [...acc, { ...metricDataResult, Values: undefined }];
          return [...acc, metricDataResult];
        },
        [] as MetricDataResult[]
      )
    });

    const response = await injectAuthorizedRequest(server, { url: route });
    const { metrics, ...rest } = JSON.parse(
      response.payload
    ) as GetStreamSessionBody;

    expect(rest).toMatchObject(streamSessionMock);
    expect(response.statusCode).toBe(200);
    expect(metrics.length).toBe(4);
    expect(metrics).toMatchSnapshot();
    expect(
      metrics.find(({ label }) => label === INGEST_FRAMERATE)?.statistics
        .average
    ).toBeUndefined();
    expect(
      metrics.find(({ label }) => label === INGEST_VIDEO_BITRATE)?.statistics
        .maximum
    ).toBeUndefined();
  });

  it('should handle missing MetricResults in the CloudWatch response and return partial statistics', async () => {
    mockCloudwatchClient.on(GetMetricDataCommand).resolves({
      MetricDataResults: metricDataResultsMock.reduce(
        (acc, metricDataResult) => {
          if (
            [`${INGEST_FRAMERATE}Avg`, `${INGEST_VIDEO_BITRATE}Max`].includes(
              metricDataResult.Label
            )
          )
            return acc;
          return [...acc, metricDataResult];
        },
        [] as MetricDataResult[]
      )
    });

    const response = await injectAuthorizedRequest(server, { url: route });
    const { metrics, ...rest } = JSON.parse(
      response.payload
    ) as GetStreamSessionBody;

    expect(rest).toMatchObject(streamSessionMock);
    expect(response.statusCode).toBe(200);
    expect(metrics.length).toBe(4);
    expect(metrics).toMatchSnapshot();
    expect(
      metrics.find(({ label }) => label === INGEST_FRAMERATE)?.statistics
        .average
    ).toBeUndefined();
    expect(
      metrics.find(({ label }) => label === INGEST_VIDEO_BITRATE)?.statistics
        .maximum
    ).toBeUndefined();
  });
});
