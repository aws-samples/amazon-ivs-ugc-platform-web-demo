import PropTypes from 'prop-types';

import { Check, Error } from '../../../../../assets/icons';
import Button from '../../../../../components/Button';
import useDateTime from '../../../../../hooks/useDateTime';
import './NavigatorPopup.css';

const StreamSessionButton = ({ streamSession, handleSessionClick }) => {
  const { startTime, endTime, hasErrorEvent, isLive } = streamSession;
  const [date, time, dayDiff] = useDateTime(startTime, endTime, isLive, 5);

  return (
    <Button
      className="session-button"
      onClick={() => handleSessionClick(streamSession)}
      variant="secondary"
    >
      <div className="session-data">
        <span className="session-date">
          <h3>{date}</h3>
          {isLive && <p>LIVE</p>}
        </span>
        <span className="session-time">
          <p className="p1">{time}</p>
          {dayDiff > 0 && <p className="day-diff p3">+{dayDiff}d</p>}
        </span>
      </div>
      {hasErrorEvent ? (
        <Error className="session-icon error" />
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
