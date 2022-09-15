import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { clsm } from '../../../utils';
import { CONCURRENT_VIEWS } from '../../../constants';
import { Hourglass, Visibility } from '../../../assets/icons';
import { streamManager as $streamManagerContent } from '../../../content';
import { useStreams } from '../../../contexts/Streams';
import HealthIndicator from './HealthIndicator';
import StatusItem from './StatusItem/StatusItem';
import useElapsedTime from '../../../hooks/useElapsedTime';

const $content = $streamManagerContent.status_bar;
const NO_DATA_VALUE = '------';
const NO_ELAPSED_TIME_VALUE = '--:--:--';

const StatusBar = () => {
  const { activeStreamSession } = useStreams();
  const { isHealthy, isLive, metrics, startTime } = activeStreamSession || {};
  const navigate = useNavigate();

  // Elapsed Stream Time
  let elapsedTime = useElapsedTime(startTime);

  // Concurrent Stream Views
  const { data: concurrentViewsData = [] } =
    metrics?.find((metric) => metric.label === CONCURRENT_VIEWS) || {};
  let concurrentViews = concurrentViewsData[concurrentViewsData.length - 1];
  concurrentViews =
    typeof concurrentViews === 'number'
      ? Math.round(concurrentViews)
      : NO_DATA_VALUE;

  // Stream Health/Stability
  let health = NO_DATA_VALUE; // unknown stream health
  if (isHealthy === true) health = $content.stable;
  if (isHealthy === false) health = $content.poor;

  if (!isLive) {
    elapsedTime = NO_ELAPSED_TIME_VALUE;
    concurrentViews = NO_DATA_VALUE;
    health = NO_DATA_VALUE;
  }

  const handleHealthClick = useCallback(() => navigate('/health'), [navigate]);

  return (
    <div
      className={clsm([
        'grid',
        'grid-rows-1',
        'grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,74px)]',
        'items-center',
        'h-12',
        'w-full',
        'max-w-[320px]',
        'px-4',
        'py-3.5',
        'rounded-3xl',
        'bg-lightMode-gray-extraLight',
        'dark:bg-darkMode-gray-dark'
      ])}
    >
      <StatusItem icon={<Hourglass />} value={elapsedTime} />
      <StatusItem
        {...(isLive ? { tooltipText: $content.concurrent_views } : {})}
        icon={<Visibility />}
        value={concurrentViews}
      />
      <StatusItem
        {...(isLive
          ? {
              onClick: handleHealthClick,
              tooltipText: $content.view_stream_health
            }
          : {})}
        icon={<HealthIndicator health={health} />}
        value={health}
      />
    </div>
  );
};

export default StatusBar;
