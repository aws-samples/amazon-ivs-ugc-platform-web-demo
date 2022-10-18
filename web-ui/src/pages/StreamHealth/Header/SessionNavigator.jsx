import PropTypes from 'prop-types';
import { forwardRef } from 'react';

import { bound, clsm } from '../../../utils';
import { ChevronLeft, ChevronRight } from '../../../assets/icons';
import { dashboard as $dashboardContent } from '../../../content';
import { useStreams } from '../../../contexts/Streams';
import Button from '../../../components/Button';
import useDateTime from '../../../hooks/useDateTime';

const $content = $dashboardContent.header;
const NAV_BUTTON_CLASSES = [
  'h-auto',
  'py-1.5',
  'px-3.5',
  'min-w-[auto]',
  'xs:hidden',
  'bg-lightMode-gray-extraLight'
];
const TIME_CLASSES = [
  'dark:text-darkMode-gray-light',
  'flex',
  'space-x-0.5',
  'items-center',
  'justify-center',
  'text-lightMode-gray-medium'
];

const SessionNavigator = forwardRef(
  ({ isNavOpen, toggleNavPopup }, navButtonRef) => {
    const {
      activeStreamSession,
      fetchStreamSessionsError,
      isInitialFetchingStreamData,
      streamSessions,
      updateActiveStreamSession,
      refreshCurrentStreamSessions
    } = useStreams();
    const { startTime, endTime, isLive } = activeStreamSession || {};
    const [date, time, dayDiff] = useDateTime(startTime, endTime, 5);

    const sessionsLength = streamSessions?.length;
    const isPrevDisabled =
      !activeStreamSession ||
      !sessionsLength ||
      activeStreamSession.index === 0;
    const isNextDisabled =
      !activeStreamSession ||
      !sessionsLength ||
      activeStreamSession.index === sessionsLength - 1;

    const handleSessionNavigator = () => {
      if (!isNavOpen) refreshCurrentStreamSessions();
      toggleNavPopup();
    };

    const handleNextStream = (e) => {
      if (!isNextDisabled) {
        const nextStreamSessionIdx = bound(
          activeStreamSession.index + 1,
          0,
          sessionsLength
        );

        updateActiveStreamSession(streamSessions?.[nextStreamSessionIdx]);
      }
    };

    const handlePreviousStream = () => {
      if (!isPrevDisabled) {
        const prevStreamSessionIdx = bound(
          activeStreamSession.index - 1,
          0,
          sessionsLength
        );
        updateActiveStreamSession(streamSessions?.[prevStreamSessionIdx]);
      }
    };

    return (
      <div
        className={clsm([
          'self-center',
          'space-x-2.5',
          'flex',
          'justify-center',
          'col-start-2'
        ])}
      >
        <Button
          className={clsm(NAV_BUTTON_CLASSES)}
          isDisabled={isNextDisabled}
          onClick={handleNextStream}
          variant="secondary"
        >
          <ChevronLeft />
        </Button>
        <Button
          className={clsm([
            'h-12',
            'lg:max-w-xs',
            'max-w-lg',
            'p-2',
            'sm:max-w-none',
            'w-full',
            'bg-lightMode-gray-extraLight'
          ])}
          isDisabled={!!fetchStreamSessionsError}
          onClick={handleSessionNavigator}
          ref={navButtonRef}
          variant="secondary"
        >
          <span className={clsm(['flex', 'flex-col'])}>
            {isNavOpen || !activeStreamSession ? (
              <>
                <p className="date">{$content.stream_session}</p>
                {!fetchStreamSessionsError && !isInitialFetchingStreamData && (
                  <p className={clsm(['p3', TIME_CLASSES])}>
                    {$content.select_stream_session}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="date">{date}</p>
                <span className={clsm(['p3', TIME_CLASSES])}>
                  {isLive
                    ? `${$content.session_navigator.started} ${time}`
                    : time}
                  {dayDiff > 0 && <p className="day-diff p3">+{dayDiff}d</p>}
                </span>
              </>
            )}
          </span>
        </Button>
        <Button
          className={clsm(NAV_BUTTON_CLASSES)}
          isDisabled={isPrevDisabled}
          onClick={handlePreviousStream}
          variant="secondary"
        >
          <ChevronRight />
        </Button>
      </div>
    );
  }
);

SessionNavigator.defaultProps = { isNavOpen: false };

SessionNavigator.propTypes = {
  isNavOpen: PropTypes.bool,
  toggleNavPopup: PropTypes.func.isRequired
};

export default SessionNavigator;
