import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  convertMetricValue,
  generateEventMarkers,
  getBoundRelativeTimes,
  ingestFramerateTooltipFormatter,
  ingestVideoBitrateTooltipFormatter,
  processMetricData
} from './utils';
import {
  INGEST_FRAMERATE,
  INGEST_VIDEO_BITRATE,
  NO_DATA_VALUE
} from '../../../../../constants';
import {
  useSynchronizedCharts,
  ZOOM_LEVELS
} from '../../../../../contexts/SynchronizedCharts';
import { bound } from '../../../../../utils';
import { dashboard as $dashboardContent } from '../../../../../content';
import { formatTime } from '../../../../../hooks/useDateTime';
import { processEvents } from '../StreamEvents/utils';
import { useStreams } from '../../../../../contexts/Streams';
import MetricPanel from '../MetricPanel';
import ResponsiveChart from './Chart';
import usePrevious from '../../../../../hooks/usePrevious';
import ZoomButtons from './ZoomButtons';
import ZoomSlider from './ZoomSlider';
import './Charts.css';

const $content = $dashboardContent.stream_session_page.charts;

const UNITS = {
  [INGEST_FRAMERATE]: 'fps',
  [INGEST_VIDEO_BITRATE]: 'mbps'
};

const Charts = () => {
  const chartsRef = useRef();
  const {
    activeStreamSession,
    hasActiveStreamChanged,
    fetchActiveStreamSessionError,
    isLoadingStreamData
  } = useStreams();
  const {
    handleSynchronizedTooltips,
    isTooltipOpen,
    selectedZoomLevel,
    setZoomBounds,
    setSelectedZoomLevel,
    zoomBounds
  } = useSynchronizedCharts();
  const { isLive, metrics, truncatedEvents } = activeStreamSession || {};
  const {
    IngestVideoBitrate: ingestVideoBitrateData = {},
    IngestFramerate: ingestFramerateData = {}
  } =
    metrics?.reduce((dataSet, metric) => {
      const { label } = metric;
      if (label === INGEST_VIDEO_BITRATE || label === INGEST_FRAMERATE) {
        dataSet[label] = metric;
      }

      return dataSet;
    }, {}) || {};
  const [dataLength, setDataLength] = useState(
    ingestVideoBitrateData?.data?.length || 1
  );
  const isMetricDataAvailable =
    !isLoadingStreamData && !fetchActiveStreamSessionError && dataLength > 1;
  const prevDataLength = usePrevious(dataLength);
  const dataPeriod = ingestVideoBitrateData?.period || 0;
  const eventsToDisplay = useMemo(() => {
    const [relativeStartTime, relativeEndTime] = getBoundRelativeTimes(
      [0, dataLength - 1],
      ingestVideoBitrateData.alignedStartTime,
      dataPeriod
    );

    if (truncatedEvents?.length) {
      const streamEvents = isLive
        ? processEvents(truncatedEvents).reverse()
        : processEvents(truncatedEvents);

      return streamEvents.reduce(
        (acc, { error, eventTime, originalName: name }) => {
          const relativeEventTime = new Date(eventTime).getTime();
          const hasRequiredProps = relativeEventTime && name;
          const zoomEventIndex =
            ((relativeEventTime - relativeStartTime) /
              (relativeEndTime - relativeStartTime)) *
            (dataLength - 1);

          /**
           * We include any type of error event even if they're not visible.
           * That includes starvation events so we can show gradients in between non-visible events
           */
          if (hasRequiredProps && (error || name === 'Starvation End')) {
            return [...acc, { zoomEventIndex, relativeEventTime, name }];
          }

          return acc;
        },
        []
      );
    }

    return [];
  }, [
    dataLength,
    dataPeriod,
    ingestVideoBitrateData.alignedStartTime,
    isLive,
    truncatedEvents
  ]);
  const eventMarkers = useMemo(
    () => generateEventMarkers(eventsToDisplay),
    [eventsToDisplay]
  );

  const getChartMetricPanelProps = useCallback(
    (metricData) => {
      let zoomStart, zoomEnd, currentValue;

      if (isMetricDataAvailable) {
        const [relativeStartTime, relativeEndTime] = getBoundRelativeTimes(
          zoomBounds,
          ingestVideoBitrateData.alignedStartTime,
          dataPeriod
        );

        zoomStart = formatTime(relativeStartTime, null, false);
        zoomEnd =
          zoomBounds[1] === dataLength - 1 && isLive
            ? $content.now
            : formatTime(relativeEndTime, null, false);

        if (metricData?.data?.length && isLive) {
          currentValue = metricData.data[metricData.data.length - 1];
        } else if (metricData?.statistics?.average && !isLive) {
          currentValue = metricData.statistics.average;
        }

        currentValue = convertMetricValue(currentValue, metricData.label);
        currentValue =
          typeof currentValue === 'number'
            ? `${
                metricData.label === INGEST_VIDEO_BITRATE
                  ? currentValue.toFixed(1)
                  : currentValue.toFixed(0)
              } ${UNITS[metricData.label]}`
            : NO_DATA_VALUE;
      } else {
        zoomStart = zoomEnd = currentValue = NO_DATA_VALUE;
      }

      const hasData = metricData?.data?.length >= 2;
      const isWaitingForData =
        activeStreamSession &&
        !isLoadingStreamData &&
        !fetchActiveStreamSessionError &&
        isLive &&
        // Ingest framerate data sometimes comes after video bitrate
        !hasData;
      const isChartLoading = isLoadingStreamData || isWaitingForData;

      return {
        hasData,
        isLoading: isChartLoading,
        wrapper: { classNames: ['chart'] },
        header: <h2>{currentValue}</h2>,
        footerClassNames: ['chart-time-range-footer'],
        footer: (
          <>
            <p className="p2">{zoomStart}</p>
            <p className="p2">{zoomEnd}</p>
          </>
        )
      };
    },
    [
      activeStreamSession,
      dataLength,
      dataPeriod,
      fetchActiveStreamSessionError,
      ingestVideoBitrateData.alignedStartTime,
      isLive,
      isLoadingStreamData,
      isMetricDataAvailable,
      zoomBounds
    ]
  );
  const renderChart = useCallback(
    (Chart) => {
      if (!activeStreamSession) return null;

      return Chart;
    },
    [activeStreamSession]
  );

  const updateSelectedZoom = useCallback(
    (zoomAmountInSeconds) => {
      const newDataLength = ingestVideoBitrateData?.data?.length || 1;
      setDataLength(newDataLength);

      if (zoomAmountInSeconds === -1) {
        setZoomBounds([0, newDataLength - 1]);
        setSelectedZoomLevel(parseInt(zoomAmountInSeconds, 10));

        return;
      }

      const numOfDatapoints = bound(zoomAmountInSeconds / dataPeriod, 1);
      const lowerBound = newDataLength - 1 - numOfDatapoints;

      setZoomBounds(() => [
        bound(lowerBound, 0, newDataLength - 1),
        bound(newDataLength - 1, 0, newDataLength - 1)
      ]);
      setSelectedZoomLevel(parseInt(zoomAmountInSeconds, 10));
    },
    [
      dataPeriod,
      ingestVideoBitrateData?.data?.length,
      setSelectedZoomLevel,
      setZoomBounds
    ]
  );
  const handleSelectZoom = useCallback(
    ({ target: { value: zoomAmountInSeconds } }) => {
      updateSelectedZoom(parseInt(zoomAmountInSeconds, 10));
    },
    [updateSelectedZoom]
  );

  // Update the zoom bounds and zoom level when the stream changes or when the stream status changes (live to offline)
  useEffect(() => {
    if (hasActiveStreamChanged || !isLive) {
      updateSelectedZoom(isLive ? ZOOM_LEVELS.FIVE_MIN : ZOOM_LEVELS.ALL);
    }
  }, [hasActiveStreamChanged, isLive, updateSelectedZoom]);

  // Update the initial zoom bounds and zoom level when new metrics data is fetched
  useEffect(() => {
    const newDataLength = ingestVideoBitrateData?.data?.length || 1;
    setDataLength(newDataLength);

    if (isMetricDataAvailable) {
      setZoomBounds((prevBounds) => {
        const [prevLowerBound, prevUpperBound] = prevBounds;

        // When the stream is live default to the last 5 mins
        if (prevUpperBound === 0 && isLive) {
          const numOfDatapoints = bound(ZOOM_LEVELS.FIVE_MIN / dataPeriod, 1);
          const lowerBound = newDataLength - 1 - numOfDatapoints;

          return [bound(lowerBound, 0), newDataLength - 1];
          // When the stream is offline default to the entire dataset
        } else if (prevUpperBound === 0) {
          return [0, newDataLength - 1];
        } else if (
          prevDataLength < newDataLength &&
          prevUpperBound === prevDataLength - 1
        ) {
          const newUpperBound = newDataLength - 1;
          let newLowerBound = prevLowerBound;

          if (prevLowerBound > 0) {
            const offset = newDataLength - prevDataLength;
            newLowerBound += offset;
          }

          return [newLowerBound, newUpperBound];
        }

        return prevBounds;
      });
    }
  }, [
    dataPeriod,
    ingestVideoBitrateData?.data?.length,
    isLive,
    isMetricDataAvailable,
    prevDataLength,
    setZoomBounds
  ]);

  useEffect(() => {
    if (isMetricDataAvailable && isTooltipOpen) {
      handleSynchronizedTooltips();
    }
  }, [
    ingestVideoBitrateData,
    isMetricDataAvailable,
    handleSynchronizedTooltips,
    isTooltipOpen
  ]);

  return (
    <div className="charts" ref={chartsRef}>
      <MetricPanel
        title={$content.video_bitrate}
        {...getChartMetricPanelProps(ingestVideoBitrateData)}
      >
        {renderChart(
          <ResponsiveChart
            eventMarkers={eventMarkers}
            initialData={processMetricData(ingestVideoBitrateData)}
            formatter={ingestVideoBitrateTooltipFormatter}
            zoomBounds={zoomBounds}
          />
        )}
      </MetricPanel>
      <MetricPanel
        title={$content.frame_rate}
        {...getChartMetricPanelProps(ingestFramerateData)}
      >
        {renderChart(
          <ResponsiveChart
            eventMarkers={eventMarkers}
            initialData={processMetricData(ingestFramerateData)}
            formatter={ingestFramerateTooltipFormatter}
            zoomBounds={zoomBounds}
          />
        )}
      </MetricPanel>
      <div className="chart-controls">
        <ZoomSlider
          chartsRef={chartsRef}
          dataLength={dataLength}
          eventsToDisplay={eventsToDisplay}
          isEnabled={isMetricDataAvailable}
          setZoomBounds={setZoomBounds}
          setSelectedZoomLevel={setSelectedZoomLevel}
          zoomBounds={zoomBounds}
        />
        <ZoomButtons
          handleSelectZoom={handleSelectZoom}
          isEnabled={isMetricDataAvailable}
          selectedZoomLevel={selectedZoomLevel}
        />
      </div>
    </div>
  );
};

export default Charts;
