import { useCallback } from 'react';

import { app as $appContent } from '../../content';
import { BREAKPOINTS, CONCURRENT_VIEWS } from '../../constants';
import { clsm } from '../../utils';
import { convertConcurrentViews } from '../../utils';
import { Hourglass, Visibility } from '../../assets/icons';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice';
import { useStreams } from '../../contexts/Streams';
import HealthIndicator from './HealthIndicator';
import StreamStatus from './StatusItem/StreamStatus';
import StatusItem from './StatusItem/StatusItem';
import useCurrentPage from '../../hooks/useCurrentPage';
import useElapsedTime from '../../hooks/useElapsedTime';
import { isFireFox } from '../../pages/Channel/Player/useProfileViewPlayerAnimation/utils';

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
  const isCurrentScreenXxs = currentBreakpoint === BREAKPOINTS.xxs;

  const latestStreamSessionData = hasStreamSessions ? streamSessions[0] : {};
  const activeStreamSessionData = activeStreamSession
    ? activeStreamSession
    : {};
  const currentPage = useCurrentPage();
  const isStreamHealthPage = currentPage === 'stream_health';
  const streamSessionData = isStreamHealthPage
    ? activeStreamSessionData
    : latestStreamSessionData;

  const { isHealthy, isLive, metrics, startTime, hasErrorEvent } =
    streamSessionData;

  // Elapsed Stream Time
  let elapsedTime = useElapsedTime(startTime);
  const isMac = navigator.userAgent.includes('Mac');

  // Concurrent Stream Views
  const concurrentViewsMetric = metrics?.find(
    (metric) => metric.label === CONCURRENT_VIEWS
  );

  let concurrentViewsValue = NO_DATA_VALUE;
  if (concurrentViewsMetric?.data?.length && isLive) {
    concurrentViewsValue = convertConcurrentViews(
      Math.round(
        concurrentViewsMetric.data[concurrentViewsMetric.data.length - 1]
      )
    );
  } else if (
    typeof concurrentViewsMetric?.statistics?.average === 'number' &&
    !isLive
  ) {
    concurrentViewsValue = convertConcurrentViews(
      Math.round(concurrentViewsMetric.statistics.average)
    );
  }
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
    window.open('/health', '_blank');
  }, [streamSessions, updateActiveStreamSession]);

  return (
    <div
      className={clsm([
        'bg-lightMode-gray-extraLight',
        'dark:bg-darkMode-gray-dark',
        'flex',
        'h-full',
        'items-center',
        'justify-between',
        'max-w-[316px]',
        'mb-6',
        'px-2',
        'py-3.5',
        'rounded-full',
        'w-full',
        'max-h-12',
        isStreamHealthPage && ['max-w-[240px]', 'mt-8', 'mb-2.5', 'md:mb-[2px]']
      ])}
      role="status"
    >
      <StreamStatus isLive={isLive} />
      <StatusItem
        dataTestId="status-item-time-elapsed"
        icon={<Hourglass />}
        isLive={isLive}
        itemLabel="Stream elapsed time"
        role="timer"
        value={elapsedTime}
        className={clsm([
          elapsedTime === NO_ELAPSED_TIME_VALUE
            ? 'w-auto'
            : ['w-[98px]', 'sm:w-[82px]'],
          isCurrentScreenXxs && 'min-w-[78px]',
          'sm:[&>div>button]:px-0'
        ])}
      />
      <StatusItem
        concurrentViewsTooltipText={concurrentViewsTooltipText}
        dataTestId="status-item-concurrent-views"
        hasError={hasErrorEvent && isLive && isStreamHealthPage}
        icon={<Visibility />}
        isLive={isLive}
        itemLabel="Stream concurrent views count"
        value={concurrentViewsValue}
        className={clsm([
          concurrentViewsValue === NO_DATA_VALUE
            ? 'w-auto'
            : ['w-[77px]', 'md:w-[62px]', 'sm:w-[77px], xs:w-[62px]'],
          concurrentViewsValue?.length > 4 &&
            concurrentViewsValue !== NO_DATA_VALUE && [
              'w-[82px]',
              'md:w-[74px]',
              'sm:w-[77px]',
              'xs:w-[72px]'
            ],

          !isFireFox && !isMac && ['[&>div>div]:px-0', 'sm:[&>div>button]:px-0']
        ])}
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
          dataTestId="status-item-health-status"
          icon={<HealthIndicator health={health} />}
          itemLabel="Stream health status"
          className={clsm([
            !isCurrentScreenXxs
              ? ['sm:min-w-[66px]', 'min-w-[76px]']
              : ['w-auto', 'mr-2', 'ml-1'],
            'sm:[&>div>button]:px-1'
          ])}
        />
      )}
    </div>
  );
};

export default StatusBar;
