import './StatsCard.css';
import { CONCURRENT_VIEWS, NO_DATA_VALUE } from '../../../../constants';
import { dashboard as $dashboardContent } from '../../../../content';
import { useStreams } from '../../../../contexts/Streams';
import { Visibility } from '../../../../assets/icons';
import TimeElapsed from './TimeElapsed';
import Tooltip from '../../../../components/Tooltip';

const $content = $dashboardContent.stream_session_page.stats_card;

const StatsCard = (props) => {
  const { activeStreamSession = {} } = useStreams();
  const { hasErrorEvent, isLive, metrics } = activeStreamSession;
  const concurrentViewsMetric = metrics?.find(
    (metric) => metric.label === CONCURRENT_VIEWS
  );
  let concurrentViewsValue;
  if (concurrentViewsMetric?.data?.length && isLive) {
    concurrentViewsValue =
      concurrentViewsMetric.data[concurrentViewsMetric.data.length - 1];
  } else if (concurrentViewsMetric?.statistics?.average && !isLive) {
    concurrentViewsValue = concurrentViewsMetric.statistics.average;
  }
  concurrentViewsValue =
    typeof concurrentViewsValue === 'number'
      ? Math.round(concurrentViewsValue)
      : NO_DATA_VALUE;

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
            {concurrentViewsValue}
          </p>
          {!isLive && typeof concurrentViewsValue === 'number' && (
            <p className="p2">{$content.avg}</p>
          )}
        </div>
      </Tooltip>
    </div>
  );
};

export default StatsCard;