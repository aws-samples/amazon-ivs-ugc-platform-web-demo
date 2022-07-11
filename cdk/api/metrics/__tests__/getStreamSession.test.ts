import {
  GetMetricDataCommand,
  MetricDataResult
} from '@aws-sdk/client-cloudwatch';
import { GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { GetStreamSessionCommand } from '@aws-sdk/client-ivs';
import { LightMyRequestResponse } from 'fastify';
import { marshall } from '@aws-sdk/util-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';

import {
  INGEST_FRAMERATE,
  INGEST_VIDEO_BITRATE,
  UNEXPECTED_EXCEPTION
} from '../../shared/constants';
import { cloudwatchClient, GetStreamSessionBody } from '../getStreamSession';
import { dynamoDbClient, ivsClient } from '../helpers';
import { injectAuthorizedRequest } from '../../testUtils';
import buildServer from '../../buildServer';
import metricDataResultsJsonMock from '../../__mocks__/metricDataResults.json';
import streamSessionMock from '../../__mocks__/streamSession.json';
import formattedMetricsDataMock from '../../__mocks__/formattedMetricsData.json';

const metricDataResultsMock = metricDataResultsJsonMock.map(
  (metricDataResult) => ({
    ...metricDataResult,
    Timestamps: metricDataResult.Timestamps.map(
      (timestamp) => new Date(timestamp)
    )
  })
);
const streamSessionResultsMock = {
  ...streamSessionMock,
  truncatedEvents: streamSessionMock.truncatedEvents.map((event) => ({
    ...event,
    eventTime: new Date(event.eventTime)
  }))
};
const mockIvsClient = mockClient(ivsClient);
const mockCloudwatchClient = mockClient(cloudwatchClient);
const mockDynamoDbClient = mockClient(dynamoDbClient);
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
        ...streamSessionResultsMock,
        startTime: mockDefaultStartTime
      }
    });

    mockCloudwatchClient.reset();
    mockCloudwatchClient.on(GetMetricDataCommand).resolves({});

    mockDynamoDbClient.reset();
    mockDynamoDbClient.on(GetItemCommand).resolves({});
  });

  describe('error handling', () => {
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
  });

  describe('general cases', () => {
    const setupOfflineStreamTest = () => {
      mockIvsClient.on(GetStreamSessionCommand).resolves({
        streamSession: {
          ...streamSessionResultsMock,
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
    };
    const assertMetricsResponse = (
      response: LightMyRequestResponse,
      expectedIngestFramerateLength: number,
      parsedPayload: GetStreamSessionBody
    ) => {
      const { metrics, ...rest } = parsedPayload;
      const ingestFramerateMetric = metrics.find(
        ({ label }) => label === INGEST_FRAMERATE
      );

      expect(rest).toMatchObject(streamSessionResultsMock);
      expect(response.statusCode).toBe(200);
      expect(metrics.length).toBe(4);
      expect(metrics).toMatchSnapshot();
      expect(ingestFramerateMetric!.data.length).toBe(
        expectedIngestFramerateLength
      );
    };

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
      const parsedPayload = JSON.parse(
        response.payload
      ) as GetStreamSessionBody;

      assertMetricsResponse(response, 56, parsedPayload);
      expect(mockDynamoDbClient).not.toHaveReceivedCommand(UpdateItemCommand);
      expect(parsedPayload.truncatedEvents).toEqual(
        streamSessionMock.truncatedEvents
      );
    });

    it('should return the correct metrics for an offline stream less than 3 hours long', async () => {
      setupOfflineStreamTest();

      const response = await injectAuthorizedRequest(server, { url: route });
      const parsedPayload = JSON.parse(
        response.payload
      ) as GetStreamSessionBody;

      assertMetricsResponse(response, 62, parsedPayload);
      // Check that the key used to store the metrics in the Dynamo table is correct
      expect(
        mockDynamoDbClient.commandCalls(UpdateItemCommand)[0].args[0].input
          .AttributeUpdates?.metrics.Value?.M?.[
          'P5-S1654888020000-E1654888325000'
        ]
      ).toBeTruthy();
      expect(parsedPayload.truncatedEvents).toEqual(
        [...streamSessionMock.truncatedEvents].reverse()
      );
    });

    it('should return the metrics from DynamoDB when they are available for an offline stream', async () => {
      setupOfflineStreamTest();
      mockDynamoDbClient.on(GetItemCommand).resolves({
        Item: marshall({
          metrics: {
            'P5-S1654888020000-E1654888325000': formattedMetricsDataMock
          }
        })
      });

      const response = await injectAuthorizedRequest(server, { url: route });
      const parsedPayload = JSON.parse(
        response.payload
      ) as GetStreamSessionBody;

      assertMetricsResponse(response, 62, parsedPayload);
      expect(mockDynamoDbClient).not.toHaveReceivedCommand(UpdateItemCommand);
      expect(parsedPayload.truncatedEvents).toEqual(
        [...streamSessionMock.truncatedEvents].reverse()
      );
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
          ...streamSessionResultsMock,
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
      const parsedPayload = JSON.parse(
        response.payload
      ) as GetStreamSessionBody;
      const { metrics, ...rest } = parsedPayload;

      expect(rest).toMatchObject(streamSessionResultsMock);
      expect(response.statusCode).toBe(200);
      expect(metrics.length).toBe(4);
      expect(
        mockDynamoDbClient.commandCalls(UpdateItemCommand)[0].args[0].input
          .AttributeUpdates?.metrics.Value?.M?.[
          'P300-S1649445300000-E1649445600000'
        ]
      ).toBeTruthy();
      expect(parsedPayload.truncatedEvents).toEqual(
        [...streamSessionMock.truncatedEvents].reverse()
      );
    });
  });

  describe('partial and empty metrics', () => {
    it('should return empty metrics if CloudWatch returns empty metrics', async () => {
      const response = await injectAuthorizedRequest(server, { url: route });
      const { metrics, ...rest } = JSON.parse(response.payload);

      expect(rest).toMatchObject(streamSessionResultsMock);
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

      expect(rest).toMatchObject(streamSessionResultsMock);
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

      expect(rest).toMatchObject(streamSessionResultsMock);
      expect(response.statusCode).toBe(200);
      expect(metrics.length).toBe(4);
      expect(metrics).toMatchSnapshot();
      expect(
        metrics.find(({ label }) => label === INGEST_FRAMERATE)?.statistics
          .average
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

      expect(rest).toMatchObject(streamSessionResultsMock);
      expect(response.statusCode).toBe(200);
      expect(metrics.length).toBe(4);
      expect(metrics).toMatchSnapshot();
      expect(
        metrics.find(({ label }) => label === INGEST_FRAMERATE)?.statistics
          .average
      ).toBeUndefined();
    });
  });
});
