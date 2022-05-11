import PropTypes from 'prop-types';
import { forwardRef } from 'react';

import { Check, Error } from '../../../../../assets/icons';
import { dashboard as $dashboardContent } from '../../../../../content';
import { useStreams } from '../../../../../contexts/Streams';
import {
  formatDate,
  formatTime,
  getDayDiff,
  groupStreamSessions
} from '../utils';
import Button from '../../../../../components/Button';
import withPortal from '../../../../../components/withPortal';
import './NavigatorPopup.css';

const $content = $dashboardContent.header.session_navigator;

const NavigatorPopup = forwardRef(({ toggleNavPopup }, ref) => {
  const { streamSessions, updateActiveSession } = useStreams();

  const handleSessionClick = (streamSession) => {
    updateActiveSession(streamSession);
    toggleNavPopup();
  };

  return (
    <div className="nav-popup" ref={ref}>
      {streamSessions.length ? (
        groupStreamSessions(streamSessions).map(
          ({ groupLabel, sessionData }) => (
            <div
              className="session-group"
              key={groupLabel.replace(/\s+/g, '-').toLowerCase()}
            >
              <h4>{groupLabel}</h4>
              {sessionData.map((streamSession, i) => {
                const { streamId, startTime, endTime, hasErrorEvent, isLive } =
                  streamSession;
                const date = formatDate(startTime);
                const time = formatTime(startTime, endTime);
                const dayDiff = !isLive && getDayDiff(startTime, endTime);

                return (
                  <Button
                    className="session-button"
                    key={streamId}
                    onClick={() => handleSessionClick(streamSession)}
                    variant="secondary"
                  >
                    <div className="session-data">
                      <span className="session-date">
                        <h3>{date}</h3>
                        {isLive && <p>LIVE</p>}
                      </span>
                      <span className="session-time">
                        <p>{time}</p>
                        {dayDiff > 0 && <p className="day-diff">+{dayDiff}d</p>}
                      </span>
                    </div>
                    {hasErrorEvent ? (
                      <Error className="session-icon error" />
                    ) : (
                      <Check className="session-icon success" />
                    )}
                  </Button>
                );
              })}
            </div>
          )
        )
      ) : (
        <span className="no-streams">
          <b>{$content.no_stream_sessions}</b>
          <p>{$content.no_stream_sessions_message}</p>
        </span>
      )}
    </div>
  );
});

NavigatorPopup.propTypes = { toggleNavPopup: PropTypes.func.isRequired };

export default withPortal(NavigatorPopup, 'nav-popup');
