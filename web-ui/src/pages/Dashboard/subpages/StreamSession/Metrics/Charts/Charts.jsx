import { useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';

import { dashboard as $dashboardContent } from '../../../../../../content';
import { SyncError } from '../../../../../../assets/icons';
import MetricPanel from '../MetricPanel';
import './Charts.css';

const $content = $dashboardContent.stream_session_page.charts;

const Charts = () => {
  const { activeStreamSession } = useOutletContext();
  const isMetricDataAvailable = !!activeStreamSession?.metrics;

  const getChartMetricPanelProps = useCallback(
    (metricType) => {
      let zoomStart, zoomEnd, currentValue;

      if (isMetricDataAvailable) {
        // TODO: derive the zoomed time ranges from the charts themselves
        zoomStart = '5 min ago';
        zoomEnd = 'Now';

        // TODO: derive the current value for the given metric type from the metrics/charts
        if (metricType === 'IngestVideoBitrate') currentValue = '0.2 mbps';
        if (metricType === 'IngestFramerate') currentValue = '30 fps';
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
    [isMetricDataAvailable]
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

  return (
    <div className="charts">
      <MetricPanel
        title={$content.video_bitrate}
        {...getChartMetricPanelProps('IngestVideoBitrate')}
      >
        {renderChart(<div>Video Bitrate Chart</div>)}
      </MetricPanel>
      <MetricPanel
        title={$content.frame_rate}
        {...getChartMetricPanelProps('IngestFramerate')}
      >
        {renderChart(<div>Frame Rate Chart</div>)}
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
