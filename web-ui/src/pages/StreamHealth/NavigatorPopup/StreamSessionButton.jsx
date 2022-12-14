import PropTypes from 'prop-types';

import { Check, ErrorIcon } from '../../../assets/icons';
import { dashboard as $dashboardContent } from '../../../content';
import Button from '../../../components/Button';
import LivePill from '../../../components/LivePill';
import useDateTime from '../../../hooks/useDateTime';
import './NavigatorPopup.css';

const $content = $dashboardContent.header.session_navigator;

const StreamSessionButton = ({ streamSession, handleSessionClick }) => {
  const { startTime, endTime, hasErrorEvent, isLive } = streamSession;
  const [date, time, dayDiff] = useDateTime(startTime, endTime, 5);
  return (
    <Button
      className="session-button"
      onClick={() => handleSessionClick(streamSession)}
      variant="secondary"
      ariaLabel={`Navigate to stream session ${streamSession.streamId}`}
    >
      <div className="session-data" data-testid="session-data">
        <span className="session-date">
          <h3>{date}</h3>
          {isLive && <LivePill />}
        </span>
        <span className="session-time">
          <p className="text-p1">
            {isLive ? `${$content.started} ${time}` : time}
          </p>
          {dayDiff > 0 && <p className="day-diff text-p3">+{dayDiff}d</p>}
        </span>
      </div>
      {hasErrorEvent ? (
        <ErrorIcon className="session-icon error" />
      ) : (
        <Check className="session-icon success" />
      )}
    </Button>
  );
};

StreamSessionButton.propTypes = {
  streamSession: PropTypes.object.isRequired,
  handleSessionClick: PropTypes.func.isRequired
};

export default StreamSessionButton;
