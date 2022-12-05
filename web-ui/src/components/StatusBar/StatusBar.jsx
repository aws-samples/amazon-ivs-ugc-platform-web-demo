import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { app as $appContent } from '../../content';
import { BREAKPOINTS, CONCURRENT_VIEWS } from '../../constants';
import { clsm } from '../../utils';
import { Hourglass, Visibility } from '../../assets/icons';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice';
import { useStreams } from '../../contexts/Streams';
import HealthIndicator from './HealthIndicator';
import StatusItem from './StatusItem/StatusItem';
import useCurrentPage from '../../hooks/useCurrentPage';
import useElapsedTime from '../../hooks/useElapsedTime';

const $content = $appContent.status_bar;
const NO_DATA_VALUE = '------';
const NO_ELAPSED_TIME_VALUE = '--:--:--';

const StatusBar = () => {
  const {
    updateActiveStreamSession,
    streamSessions,
    hasStreamSessions,
    activeStreamSession
  } = useStreams();
  const { currentBreakpoint } = useResponsiveDevice();

  const latestStreamSessionData = hasStreamSessions ? streamSessions[0] : {};
  const activeStreamSessionData = activeStreamSession
    ? activeStreamSession
    : {};

  const navigate = useNavigate();
  const currentPage = useCurrentPage();
  const isStreamHealthPage = currentPage === 'stream_health';
  const streamSessionData = isStreamHealthPage
    ? activeStreamSessionData
    : latestStreamSessionData;

  const { isHealthy, isLive, metrics, startTime, hasErrorEvent } =
    streamSessionData;

  // Elapsed Stream Time
  let elapsedTime = useElapsedTime(startTime);

  // Concurrent Stream Views
  const concurrentViewsMetric = metrics?.find(
    (metric) => metric.label === CONCURRENT_VIEWS
  );
  let concurrentViewsValue;
  if (concurrentViewsMetric?.data?.length && isLive) {
    concurrentViewsValue =
      concurrentViewsMetric.data[concurrentViewsMetric.data.length - 1];
  } else if (
    typeof concurrentViewsMetric?.statistics?.average === 'number' &&
    !isLive
  ) {
    concurrentViewsValue = concurrentViewsMetric.statistics.average;
  }
  concurrentViewsValue =
    typeof concurrentViewsValue === 'number'
      ? Math.round(concurrentViewsValue)
      : NO_DATA_VALUE;

  // Stream Health/Stability
  let health = NO_DATA_VALUE; // unknown stream health
  if (isHealthy === true) health = $content.stable;
  if (isHealthy === false) health = $content.poor;

  // Streams offline states
  if (!isStreamHealthPage && !isLive) {
    elapsedTime = NO_ELAPSED_TIME_VALUE;
    concurrentViewsValue = NO_DATA_VALUE;
    health = NO_DATA_VALUE;
  } else if (isStreamHealthPage && !isLive) {
    elapsedTime = $content.offline;
  }

  // Tooltip text
  let concurrentViewsTooltipText = '';
  if (isLive) concurrentViewsTooltipText = $content.concurrent_views;
  else if (isStreamHealthPage && !isLive) {
    concurrentViewsTooltipText = $content.concurrent_views_offline;
  }

  const handleHealthClick = useCallback(() => {
    updateActiveStreamSession(streamSessions[0]);
    navigate('/health');
  }, [navigate, streamSessions, updateActiveStreamSession]);

  return (
    <div
      className={clsm([
        'bg-lightMode-gray-extraLight',
        'dark:bg-darkMode-gray-dark',
        'flex',
        'h-full',
        'items-center',
        'justify-between',
        'max-w-[320px]',
        'mb-6',
        'px-4',
        'py-3.5',
        'rounded-full',
        'w-full',
        'max-h-12',
        isStreamHealthPage && ['max-w-[240px]', 'mt-8', 'mb-2.5', 'md:mb-[2px]']
      ])}
      role="status"
    >
      <StatusItem
        icon={<Hourglass />}
        isLive={isLive}
        itemLabel="Stream elapsed time"
        role="timer"
        value={elapsedTime}
      />
      <StatusItem
        concurrentViewsTooltipText={concurrentViewsTooltipText}
        hasError={hasErrorEvent && isLive && isStreamHealthPage}
        icon={<Visibility />}
        isLive={isLive}
        itemLabel="Stream concurrent views count"
        value={concurrentViewsValue}
      />
      {!isStreamHealthPage && (
        <StatusItem
          {...(isLive
            ? {
                itemButtonProps: {
                  'aria-label': 'Monitor the latest stream session',
                  onClick: handleHealthClick
                },
                concurrentViewsTooltipText: $content.view_stream_health
              }
            : {})}
          {...(currentBreakpoint < BREAKPOINTS.xs ? {} : { value: health })}
          icon={<HealthIndicator health={health} />}
          itemLabel="Stream health status"
        />
      )}
    </div>
  );
};

export default StatusBar;
