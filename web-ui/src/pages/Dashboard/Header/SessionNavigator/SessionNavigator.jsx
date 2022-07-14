import PropTypes from 'prop-types';
import { forwardRef } from 'react';
import { useMatch, useNavigate, useNavigationType } from 'react-router-dom';

import { bound } from '../../../../utils';
import { ChevronLeft, ChevronRight } from '../../../../assets/icons';
import { dashboard as $dashboardContent } from '../../../../content';
import { useStreams } from '../../../../contexts/Streams';
import Button from '../../../../components/Button';
import useDateTime from '../../../../hooks/useDateTime';
import './SessionNavigator.css';

const $content = $dashboardContent.header;

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
    const navigate = useNavigate();
    const navigateType = useNavigationType();
    const isDashboardPage = !!useMatch('dashboard/*');

    const sessionsLength = streamSessions?.length;
    const isPrevDisabled =
      !isDashboardPage ||
      !activeStreamSession ||
      !sessionsLength ||
      activeStreamSession.index === 0;
    const isNextDisabled =
      !isDashboardPage ||
      !activeStreamSession ||
      !sessionsLength ||
      activeStreamSession.index === sessionsLength - 1;

    const handleSessionNavigator = () => {
      if (!isDashboardPage) {
        if (navigateType === 'PUSH') {
          navigate(-1); // Return to the previously monitored session on the dashboard
        } else {
          navigate('/dashboard'); // Navigate to the dashboard and start monitoring the latest session
        }
      } else {
        if (!isNavOpen) refreshCurrentStreamSessions();
        toggleNavPopup();
      }
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

    const renderSessionNavigatorContent = () => {
      if (!isDashboardPage) return <p>{$content.return_to_session}</p>;

      return (
        <span className="date-time-container">
          {isNavOpen || !activeStreamSession ? (
            <>
              <p className="date">{$content.stream_session}</p>
              {!fetchStreamSessionsError && !isInitialFetchingStreamData && (
                <p className="time p3">{$content.select_stream_session}</p>
              )}
            </>
          ) : (
            <>
              <p className="date">{date}</p>
              <span className="time p3">
                {isLive
                  ? `${$content.session_navigator.started} ${time}`
                  : time}
                {dayDiff > 0 && <p className="day-diff p3">+{dayDiff}d</p>}
              </span>
            </>
          )}
        </span>
      );
    };

    return (
      <>
        <div className="session-navigator">
          <Button
            className="nav-button"
            isDisabled={isNextDisabled}
            onClick={handleNextStream}
            variant="secondary"
          >
            <ChevronLeft />
          </Button>
          <Button
            className="session-list"
            isDisabled={isDashboardPage && !!fetchStreamSessionsError}
            onClick={handleSessionNavigator}
            ref={navButtonRef}
            variant="secondary"
          >
            {renderSessionNavigatorContent()}
          </Button>
          <Button
            className="nav-button"
            isDisabled={isPrevDisabled}
            onClick={handlePreviousStream}
            variant="secondary"
          >
            <ChevronRight />
          </Button>
        </div>
      </>
    );
  }
);

SessionNavigator.defaultProps = { isNavOpen: false };

SessionNavigator.propTypes = {
  isNavOpen: PropTypes.bool,
  toggleNavPopup: PropTypes.func.isRequired
};

export default SessionNavigator;
