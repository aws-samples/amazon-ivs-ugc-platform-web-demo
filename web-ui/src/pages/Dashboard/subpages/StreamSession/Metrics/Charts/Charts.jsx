import { dashboard as $dashboardContent } from '../../../../../../content';
import Panel from '../MetricsPanel';
import './Charts.css';

const $content = $dashboardContent.stream_session_page.charts;

const Charts = () => (
  <div className="charts">
    <Panel
      title={$content.video_bitrate}
      header={<h2 className="cursor-reading">0.2 mbps</h2>}
      footer={
        <>
          <p className="p2">5 min ago</p>
          <p className="p2">Now</p>
        </>
      }
      footerClassNames={['chart-time-range-footer']}
    >
      <div className="chart">Video Bitrate Chart</div>
    </Panel>
    <Panel
      title={$content.frame_rate}
      header={<h2 className="cursor-reading">30 fps</h2>}
      footer={
        <>
          <p className="p2">5 min ago</p>
          <p className="p2">Now</p>
        </>
      }
      footerClassNames={['chart-time-range-footer']}
    >
      <div className="chart">Frame Rate Chart</div>
    </Panel>
    <Panel>
      <div className="chart-controls">
        <span className="zoom-slider" />
        <span className="preset-zoom-buttons">
          <button>{$content.all}</button>
          <button>{$content.one_hour}</button>
          <button>{$content.thirty_min}</button>
          <button>{$content.five_min}</button>
        </span>
      </div>
    </Panel>
  </div>
);

export default Charts;
