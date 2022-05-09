import PropTypes from 'prop-types';
import { useCallback, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { bound } from '../../../../utils';
import { ChevronLeft, ChevronRight } from '../../../../assets/icons';
import { dashboard as $content } from '../../../../content';
import { formatDate, formatTime, getDayDiff } from './utils';
import Button from '../../../../components/Button';
import NavigatorPopup from './NavigatorPopup';
import useClickAway from '../../../../hooks/useClickAway';
import useThrottledCallback from '../../../../hooks/useThrottledCallback';
import './SessionNavigator.css';

const SessionNavigator = ({
  activeStreamSession,
  streamSessions,
  updateActiveSession,
  updateSessionsList
}) => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const navPopupRef = useRef();
  const navButtonRef = useRef();
  const rootRef = useRef(document.getElementById('root'));
  const throttledUpdateSessionsList = useThrottledCallback(
    updateSessionsList,
    2000
  );
  const isPrevDisabled =
    pathname !== '/' ||
    !activeStreamSession ||
    !streamSessions.length ||
    activeStreamSession.index === 0;
  const isNextDisabled =
    pathname !== '/' ||
    !activeStreamSession ||
    !streamSessions.length ||
    activeStreamSession.index === streamSessions.length - 1;
  const returnToDashboard = pathname !== '/';

  const toggleNavPopup = useCallback(() => {
    setIsNavOpen((prev) => !prev);
  }, []);

  const handleSessionNavigator = () => {
    if (pathname !== '/') {
      navigate(-1);
    } else {
      if (!isNavOpen) throttledUpdateSessionsList();
      toggleNavPopup();
    }
  };

  const handleNextStream = (e) => {
    if (!isNextDisabled) {
      const nextStreamSessionIdx = bound(
        activeStreamSession.index + 1,
        0,
        streamSessions.length
      );
      const nextStreamSession = streamSessions[nextStreamSessionIdx];
      updateActiveSession(nextStreamSession);
    }
  };

  const handlePreviousStream = () => {
    if (!isPrevDisabled) {
      const prevStreamSessionIdx = bound(
        activeStreamSession.index - 1,
        0,
        streamSessions.length
      );
      const prevStreamSession = streamSessions[prevStreamSessionIdx];
      updateActiveSession(prevStreamSession);
    }
  };

  useClickAway([navPopupRef, navButtonRef], toggleNavPopup);

  const renderSessionNavigatorContent = () => {
    let date, time, dayDiff;

    if (returnToDashboard) return <p>{$content.header.return_to_session}</p>;

    if (activeStreamSession) {
      const { startTime, endTime, isLive } = activeStreamSession;
      date = formatDate(startTime);
      time = formatTime(startTime, endTime);
      dayDiff = !isLive && getDayDiff(startTime, endTime);
    }

    return (
      <span className="date-time-container">
        {isNavOpen || !activeStreamSession ? (
          <>
            <p className="date">Stream Session</p>
            <p className="time">Select a stream session to view</p>
          </>
        ) : (
          <>
            <p className="date">{date}</p>
            <span className="time">
              {time}
              {dayDiff > 0 && <p className="day-diff">+{dayDiff}d</p>}
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
          className={`nav-button`}
          isDisabled={isNextDisabled}
          onClick={handleNextStream}
          variant="secondary"
        >
          <ChevronLeft className="icon" />
        </Button>
        <Button
          className="session-list"
          onClick={handleSessionNavigator}
          ref={navButtonRef}
          variant="secondary"
        >
          {renderSessionNavigatorContent()}
        </Button>
        <Button
          className={`nav-button`}
          isDisabled={isPrevDisabled}
          onClick={handlePreviousStream}
          variant="secondary"
        >
          <ChevronRight className="icon" />
        </Button>
      </div>
      <NavigatorPopup
        isOpen={isNavOpen}
        parentEl={rootRef.current}
        ref={navPopupRef}
        streamSessions={streamSessions}
        toggleNavPopup={toggleNavPopup}
        updateActiveSession={updateActiveSession}
      />
    </>
  );
};

SessionNavigator.defaultProps = {
  activeStreamSession: null,
  streamSessions: []
};

SessionNavigator.propTypes = {
  activeStreamSession: PropTypes.object,
  streamSessions: PropTypes.array,
  updateActiveSession: PropTypes.func.isRequired,
  updateSessionsList: PropTypes.func.isRequired
};

export default SessionNavigator;
