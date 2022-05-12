import { useCallback, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { bound } from '../../../../utils';
import { ChevronLeft, ChevronRight } from '../../../../assets/icons';
import { dashboard as $content } from '../../../../content';
import { useStreams } from '../../../../contexts/Streams';
import Button from '../../../../components/Button';
import NavigatorPopup from './NavigatorPopup';
import useClickAway from '../../../../hooks/useClickAway';
import useDateTime from '../../../../hooks/useDateTime';
import useThrottledCallback from '../../../../hooks/useThrottledCallback';
import './SessionNavigator.css';

const SessionNavigator = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const navPopupRef = useRef();
  const navButtonRef = useRef();
  const rootRef = useRef(document.getElementById('root'));
  const {
    activeStreamSession,
    streamSessions,
    updateActiveSession,
    updateSessionsList
  } = useStreams();
  const throttledUpdateSessionsList = useThrottledCallback(
    updateSessionsList,
    2000
  );
  const [date, time, dayDiff] = useDateTime(
    activeStreamSession?.startTime,
    activeStreamSession?.endTime,
    activeStreamSession?.isLive,
    5
  );
  const isNotOnDashboard = pathname !== '/';
  const isPrevDisabled =
    isNotOnDashboard ||
    !activeStreamSession ||
    !streamSessions.length ||
    activeStreamSession.index === 0;
  const isNextDisabled =
    isNotOnDashboard ||
    !activeStreamSession ||
    !streamSessions.length ||
    activeStreamSession.index === streamSessions.length - 1;

  const toggleNavPopup = useCallback(() => {
    setIsNavOpen((prev) => !prev);
  }, []);

  const handleSessionNavigator = () => {
    if (isNotOnDashboard) {
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
      updateActiveSession(streamSessions[nextStreamSessionIdx]);
    }
  };

  const handlePreviousStream = () => {
    if (!isPrevDisabled) {
      const prevStreamSessionIdx = bound(
        activeStreamSession.index - 1,
        0,
        streamSessions.length
      );
      updateActiveSession(streamSessions[prevStreamSessionIdx]);
    }
  };

  useClickAway([navPopupRef, navButtonRef], toggleNavPopup);

  const renderSessionNavigatorContent = () => {
    if (isNotOnDashboard) return <p>{$content.header.return_to_session}</p>;

    return (
      <span className="date-time-container">
        {isNavOpen || !activeStreamSession ? (
          <>
            <p className="date">{$content.header.stream_session}</p>
            <p className="time">{$content.header.select_stream_session}</p>
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
        toggleNavPopup={toggleNavPopup}
      />
    </>
  );
};

export default SessionNavigator;
