import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { localPoint } from '@visx/event';

import {
  INGEST_FRAMERATE,
  INGEST_VIDEO_BITRATE
} from '../../../../../../constants';
import { dashboard as $dashboardContent } from '../../../../../../content';
import {
  convertMetricValue,
  ingestFramerateTooltipFormatter,
  ingestVideoBitrateTooltipFormatter,
  processMetricData
} from './utils';
import { SyncError } from '../../../../../../assets/icons';
import MetricPanel from '../MetricPanel';
import ResponsiveChart from './Chart';
import './Charts.css';

const $content = $dashboardContent.stream_session_page.charts;

const UNITS = {
  [INGEST_FRAMERATE]: 'fps',
  [INGEST_VIDEO_BITRATE]: 'mbps'
};

const Charts = () => {
  const {
    activeStreamSession,
    activeStreamSessionError,
    isInitialLoadingActiveStreamSession
  } = useOutletContext();
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
    !isInitialLoadingActiveStreamSession &&
    !activeStreamSessionError &&
    ingestVideoBitrateData.data?.length &&
    ingestFramerateData.data?.length;

  const getChartMetricPanelProps = useCallback(
    (metricData) => {
      let zoomStart, zoomEnd, currentValue;

      if (isMetricDataAvailable) {
        // TODO: derive the zoomed time ranges from the charts themselves
        zoomStart = '5 min ago';
        zoomEnd = 'Now';

        // TODO: derive the current value for the given metric type from the metrics/charts
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

  const [xValue, setXValue] = useState();
  const isTooltipOpen = useMemo(() => xValue !== undefined, [xValue]);
  const mouseXCoord = useRef();
  const handleSynchronizedTooltips = useCallback((event) => {
    const { x } = localPoint(event) || { x: mouseXCoord?.current || 0 };

    setXValue(x);
    mouseXCoord.current = x;
  }, []);

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
  const hideSynchronizedTooltips = useCallback(() => {
    setXValue(undefined);
  }, []);

  return (
    <div className="charts">
      <MetricPanel
        title={$content.video_bitrate}
        {...getChartMetricPanelProps(ingestVideoBitrateData)}
      >
        {renderChart(
          <ResponsiveChart
            data={processMetricData(ingestVideoBitrateData)}
            formatter={ingestVideoBitrateTooltipFormatter}
            handleSynchronizedTooltips={handleSynchronizedTooltips}
            hideSynchronizedTooltips={hideSynchronizedTooltips}
            maximum={convertMetricValue(
              ingestVideoBitrateData.statistics?.maximum,
              INGEST_VIDEO_BITRATE
            )}
            xValue={xValue}
          />
        )}
      </MetricPanel>
      <MetricPanel
        title={$content.frame_rate}
        {...getChartMetricPanelProps(ingestFramerateData)}
      >
        {renderChart(
          <ResponsiveChart
            data={processMetricData(ingestFramerateData)}
            formatter={ingestFramerateTooltipFormatter}
            handleSynchronizedTooltips={handleSynchronizedTooltips}
            hideSynchronizedTooltips={hideSynchronizedTooltips}
            maximum={convertMetricValue(
              ingestFramerateData.statistics?.maximum,
              INGEST_FRAMERATE
            )}
            xValue={xValue}
          />
        )}
      </MetricPanel>
      <div className="chart-controls">
        <span className="zoom-slider" />
        <span className="preset-zoom-buttons">
          <button>{$content.all}</button>
          <button>{$content.one_hour}</button>
          <button>{$content.thirty_min}</button>
          <button>{$content.five_min}</button>
        </span>
      </div>
    </div>
  );
};

export default Charts;
