import { useCallback } from 'react';

import { app as $appContent } from '../../content';
import { BREAKPOINTS, CONCURRENT_VIEWS } from '../../constants';
import { clsm } from '../../utils';
import { convertConcurrentViews } from '../../utils';
import { Hourglass, Visibility, Group } from '../../assets/icons';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice';
import { useStreams } from '../../contexts/Streams';
import HealthIndicator from './HealthIndicator';
import StreamStatus from './StatusItem/StreamStatus';
import StatusItem from './StatusItem/StatusItem';
import useCurrentPage from '../../hooks/useCurrentPage';
import useElapsedTime from '../../hooks/useElapsedTime';
import { useChannel } from '../../contexts/Channel';
import { useGlobalStage } from '../../contexts/Stage';

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
  const { isStageActive, participants, isHost } = useGlobalStage();
  const shouldDisplayStageStatusBar = isStageActive && isHost;
  const { currentBreakpoint } = useResponsiveDevice();
  const { channelData } = useChannel();
  const { stageCreationDate } = channelData || {};

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
  const isChannelLive = isLive || shouldDisplayStageStatusBar;
  const shouldShowStreamHealth =
    !isStreamHealthPage && !shouldDisplayStageStatusBar;

  // Elapsed Stream/Stage Time
  const eventStartTime = isStageActive ? Number(stageCreationDate) : startTime;
  let elapsedTime = useElapsedTime(eventStartTime);

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
  if (
    (!isStreamHealthPage && !isLive && !isStageActive) ||
    (isStageActive && !elapsedTime) ||
    (!isStreamHealthPage && isStageActive && !isHost)
  ) {
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
        'max-w-fit',
        'gap-4',
        currentBreakpoint === BREAKPOINTS.xxs && isLive && 'gap-2',
        'pl-2',
        'rounded-full',
        'w-full',
        'max-h-12',
        isStreamHealthPage && [
          'max-w-[240px]',
          'mt-8',
          'mb-2.5',
          'md:mb-[2px]',
          'py-3.5'
        ]
      ])}
      role="status"
    >
      <StreamStatus isLive={isChannelLive} />
      <StatusItem
        dataTestId="status-item-time-elapsed"
        icon={<Hourglass />}
        isLive={isChannelLive}
        itemLabel="Stream elapsed time"
        role="timer"
        value={elapsedTime}
        className={clsm([
          'w-[78px]',
          'max-w-[78px]',
          (elapsedTime === NO_ELAPSED_TIME_VALUE ||
            (isStageActive && !isHost)) &&
            'w-auto'
        ])}
      />
      {shouldDisplayStageStatusBar && (
        <StatusItem
          tooltipText={$content.session_participants}
          dataTestId="status-item-participants-count"
          icon={<Group />}
          isLive={isStageActive}
          itemLabel="Stage participants count"
          value={participants.size}
          className={clsm(['mr-6'])}
        />
      )}
      {!shouldDisplayStageStatusBar && (
        <StatusItem
          tooltipText={concurrentViewsTooltipText}
          dataTestId="status-item-concurrent-views"
          hasError={hasErrorEvent && isLive && isStreamHealthPage}
          icon={<Visibility />}
          isLive={isLive}
          itemLabel="Stream concurrent views count"
          value={concurrentViewsValue}
          className={clsm(['max-w-none', 'w-[68px]', 'justify-center'])}
        />
      )}

      {shouldShowStreamHealth && (
        <StatusItem
          {...(isLive
            ? {
                itemButtonProps: {
                  'aria-label': 'Monitor the latest stream session',
                  onClick: handleHealthClick
                },
                tooltipText: $content.view_stream_health
              }
            : {})}
          {...(currentBreakpoint < BREAKPOINTS.xs ? {} : { value: health })}
          dataTestId="status-item-health-status"
          icon={<HealthIndicator health={health} />}
          itemLabel="Stream health status"
          className={clsm([
            !isCurrentScreenXxs
              ? ['sm:min-w-[66px]', 'min-w-[76px]', 'mr-2']
              : ['w-auto', 'ml-1', 'mr-2'],
            'sm:[&>div>button]:px-1'
          ])}
        />
      )}
    </div>
  );
};

export default StatusBar;
