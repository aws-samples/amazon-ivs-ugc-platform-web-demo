import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import {
  convertMetricValue,
  ingestFramerateTooltipFormatter,
  ingestVideoBitrateTooltipFormatter,
  processMetricData
} from './utils';
import {
  INGEST_FRAMERATE,
  INGEST_VIDEO_BITRATE
} from '../../../../../../constants';
import { bound } from '../../../../../../utils';
import { dashboard as $dashboardContent } from '../../../../../../content';
import { SyncError } from '../../../../../../assets/icons';
import { useSynchronizedChartTooltip } from '../../../../../../contexts/SynchronizedChartTooltip';
import MetricPanel from '../MetricPanel';
import ResponsiveChart from './Chart';
import usePrevious from '../../../../../../hooks/usePrevious';
import ZoomButtons from './ZoomButtons';
import './Charts.css';

const $content = $dashboardContent.stream_session_page.charts;

const UNITS = {
  [INGEST_FRAMERATE]: 'fps',
  [INGEST_VIDEO_BITRATE]: 'mbps'
};

const Charts = () => {
  const {
    activeStreamSession,
    fetchActiveStreamSessionError,
    isLoadingStreamData
  } = useOutletContext();
  const { handleSynchronizedTooltips, isTooltipOpen } =
    useSynchronizedChartTooltip();
  const { isLive, metrics } = activeStreamSession || {};
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
  const isMetricDataAvailable =
    !isLoadingStreamData &&
    !fetchActiveStreamSessionError &&
    ingestVideoBitrateData.data?.length &&
    ingestFramerateData.data?.length;
  const dataLength = ingestVideoBitrateData?.data?.length || 1;
  const prevDataLength = usePrevious(dataLength);
  const dataPeriod = ingestVideoBitrateData?.period || 0;
  const [zoomBounds, setZoomBounds] = useState([0, 0]); // [lowerBound, upperBound]

  const getChartMetricPanelProps = useCallback(
    (metricData) => {
      let zoomStart, zoomEnd, currentValue;

      if (isMetricDataAvailable) {
        // TODO: derive the zoomed time ranges from the charts themselves
        zoomStart = '5 min ago';
        zoomEnd = 'Now';

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
            : '----';
      } else {
        zoomStart = zoomEnd = currentValue = '----';
      }

      return {
        wrapper: { classNames: ['chart'] },
        header: <h2 className="cursor-reading">{currentValue}</h2>,
        footerClassNames: ['chart-time-range-footer'],
        footer: (
          <>
            <p className="p2">{zoomStart}</p>
            <p className="p2">{zoomEnd}</p>
          </>
        )
      };
    },
    [isLive, isMetricDataAvailable]
  );

  const renderChart = useCallback(
    (Chart) => {
      if (!activeStreamSession) return null;

      if (!isMetricDataAvailable)
        return (
          <div className="metrics-error-container">
            <SyncError />
            <p className="p3">{$content.cant_load_data}</p>
          </div>
        );

      return Chart;
    },
    [activeStreamSession, isMetricDataAvailable]
  );

  const updateZoomBounds = useCallback(
    (zoomAmountInSeconds) => {
      if (zoomAmountInSeconds === -1) return setZoomBounds([0, dataLength - 1]);

      const numOfDatapoints = bound(zoomAmountInSeconds / dataPeriod, 1);
      const lowerBound = dataLength - 1 - numOfDatapoints;

      setZoomBounds(() => [
        bound(lowerBound, 0, dataLength - 1),
        bound(dataLength - 1, 0, dataLength - 1)
      ]);
    },
    [dataLength, dataPeriod]
  );

  // Update the inital zoom bounds when new metrics data is fetched
  useEffect(() => {
    if (isMetricDataAvailable) {
      setZoomBounds((prevBounds) => {
        const [prevLowerBound, prevUpperBound] = prevBounds;

        if (prevUpperBound === 0) {
          return [0, dataLength - 1];
        } else if (
          prevDataLength < dataLength &&
          prevUpperBound === prevDataLength - 1
        ) {
          const newUpperBound = dataLength - 1;
          let newLowerBound = prevLowerBound;

          if (prevLowerBound > 0) {
            const offset = dataLength - prevDataLength;
            newLowerBound += offset;
          }

          return [newLowerBound, newUpperBound];
        }

        return prevBounds;
      });
    }
  }, [dataLength, isMetricDataAvailable, prevDataLength]);

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
    <div className="charts">
      <MetricPanel
        title={$content.video_bitrate}
        {...getChartMetricPanelProps(ingestVideoBitrateData)}
      >
        {renderChart(
          <ResponsiveChart
            initialData={processMetricData(ingestVideoBitrateData)}
            formatter={ingestVideoBitrateTooltipFormatter}
            maximum={convertMetricValue(
              ingestVideoBitrateData.statistics?.maximum,
              INGEST_VIDEO_BITRATE
            )}
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
            initialData={processMetricData(ingestFramerateData)}
            formatter={ingestFramerateTooltipFormatter}
            maximum={convertMetricValue(
              ingestFramerateData.statistics?.maximum,
              INGEST_FRAMERATE
            )}
            zoomBounds={zoomBounds}
          />
        )}
      </MetricPanel>
      <div className="chart-controls">
        <span className="zoom-slider" />
        <ZoomButtons updateZoomBounds={updateZoomBounds} />
      </div>
    </div>
  );
};

export default Charts;
