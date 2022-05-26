import { useOutletContext } from 'react-router-dom';

import './StatsCard.css';
import { dashboard as $dashboardContent } from '../../../../../content';
import { Visibility } from '../../../../../assets/icons';
import TimeElapsed from './TimeElapsed';
import Tooltip from '../../../../../components/Tooltip';

const $content = $dashboardContent.stream_session_page.stats_card;

const StatsCard = (props) => {
  const { activeStreamSession = {} } = useOutletContext();
  const { hasErrorEvent, isLive, metrics } = activeStreamSession;
  const concurrentViewsMetricLabel = isLive
    ? 'ConcurrentViews'
    : `ConcurrentViewsAvg`;

  const concurrentViewsMetric = metrics?.find(
    (metric) => metric.label === concurrentViewsMetricLabel
  );
  let concurrentViewsValue;

  if (concurrentViewsMetric?.data?.length) {
    concurrentViewsValue =
      concurrentViewsMetric.data[concurrentViewsMetric.data.length - 1];
  }

  return (
    <div className={`stats-card-container ${isLive ? '' : 'offline'}`}>
      <div className="stats-card-status">
        <span className="status-icon"></span>
        <p className="p2" style={isLive ? { width: '57px' } : {}}>
          {isLive ? <TimeElapsed /> : $content.offline}
        </p>
      </div>
      <Tooltip
        message={
          isLive ? $content.concurrent_views : $content.concurrent_views_offline
        }
      >
        <div className="stats-card-views-count">
          <Visibility />
          <p
            className={`stats-card-views-count-value p2 ${
              hasErrorEvent && isLive ? 'error' : ''
            }`}
          >
            {typeof concurrentViewsValue === 'number'
              ? Math.round(concurrentViewsValue)
              : '----'}
          </p>
          {!isLive && <p className="p2">{$content.avg}</p>}
        </div>
      </Tooltip>
    </div>
  );
};

export default StatsCard;
