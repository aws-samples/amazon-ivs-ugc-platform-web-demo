import PropTypes from 'prop-types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { bound } from '../../../../utils';
import { ChevronLeft, ChevronRight } from '../../../../assets/icons';
import { dashboard as $content } from '../../../../content';
import { useStreams } from '../../../../contexts/Streams';
import Button from '../../../../components/Button';
import NavigatorPopup from './NavigatorPopup';
import useClickAway from '../../../../hooks/useClickAway';
import useDateTime from '../../../../hooks/useDateTime';
import useFocusTrap from '../../../../hooks/useFocusTrap';
import './SessionNavigator.css';

const SessionNavigator = ({ headerRef }) => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const navPopupRef = useRef();
  const navButtonRef = useRef();
  const rootRef = useRef(document.getElementById('root'));
  const {
    activeStreamSession,
    streamSessions,
    updateActiveStreamSession,
    updateStreamSessionsList
  } = useStreams();
  const [date, time, dayDiff] = useDateTime(
    activeStreamSession?.startTime,
    activeStreamSession?.endTime,
    activeStreamSession?.isLive,
    5
  );
  const sessionsLength = streamSessions?.length;
  const isNotOnDashboard = pathname !== '/';
  const isPrevDisabled =
    isNotOnDashboard ||
    !activeStreamSession ||
    !sessionsLength ||
    activeStreamSession.index === 0;
  const isNextDisabled =
    isNotOnDashboard ||
    !activeStreamSession ||
    !sessionsLength ||
    activeStreamSession.index === sessionsLength - 1;

  const toggleNavPopup = useCallback(() => {
    setIsNavOpen((prev) => !prev);
  }, []);

  const handleSessionNavigator = () => {
    if (isNotOnDashboard) {
      navigate(-1);
    } else {
      if (!isNavOpen) updateStreamSessionsList();
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

  useClickAway([navPopupRef, navButtonRef], toggleNavPopup);
  useFocusTrap([headerRef, navPopupRef], isNavOpen);

  useEffect(() => {
    setIsNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleCloseNav = (event) => {
      if (event.keyCode === 27) {
        setIsNavOpen(false);
        navButtonRef.current.focus();
      }
    };

    if (isNavOpen) document.addEventListener('keydown', handleCloseNav);

    return () => document.removeEventListener('keydown', handleCloseNav);
  }, [isNavOpen]);

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

SessionNavigator.propTypes = { headerRef: PropTypes.object.isRequired };

export default SessionNavigator;
