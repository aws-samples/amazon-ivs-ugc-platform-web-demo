import PropTypes from 'prop-types';
import { useCallback, useEffect, useRef } from 'react';

import { dashboard as $dashboardContent } from '../../../../../../../content';
import { ErrorIcon, Check } from '../../../../../../../assets/icons';
import { formatDate, formatTime } from '../../../../../../../hooks/useDateTime';
import Button from '../../../../../../../components/Button';
import './StreamEventsList.css';

const $content = $dashboardContent.stream_session_page.stream_events;

const StreamEventsList = ({
  isLive,
  selectedEventId,
  setSelectedEventId,
  streamEvents,
  toggleLearnMore
}) => {
  const selectedEventRef = useRef();

  const handleEventClick = ({ target }, id) => {
    setSelectedEventId((prevId) => {
      if (prevId === id) {
        selectedEventRef.current = null;
        return null;
      }

      return id;
    });
  };

  const setSelectedEventRef = useCallback(
    (eventEl) => {
      const eventId = eventEl?.attributes['data-id'].value;
      if (eventId === selectedEventId) selectedEventRef.current = eventEl;
    },
    [selectedEventId]
  );

  useEffect(() => {
    const scrollOptions = { behavior: 'smooth', block: 'nearest' };
    selectedEventRef.current?.scrollIntoView(scrollOptions);
  }, [selectedEventId]);

  return streamEvents.map(
    ({ id, name, error, success, eventTime, shortMsg, longMsg }) => {
      const isSelected = id === selectedEventId;
      const isExpandable = !!shortMsg;
      const hasLearnMore = !!longMsg;
      const date = formatDate(eventTime);
      const time = formatTime(eventTime, null, isLive);
      let eventTimestamp = isLive ? time : `${date} ${time}`;
      eventTimestamp =
        eventTimestamp.charAt(0).toUpperCase() + eventTimestamp.slice(1);

      return (
        <span
          className={`event-item${isSelected ? ' selected' : ''}`}
          data-id={id}
          key={id}
          ref={setSelectedEventRef}
        >
          <button
            className="event-button"
            type="button"
            disabled={!isExpandable}
            onClick={(e) => handleEventClick(e, id)}
          >
            <h4 className={`event-name${error ? ' error' : ''}`}>
              {name}
              {error && <ErrorIcon className="error-icon" />}
              {success && <Check className="success-icon" />}
            </h4>
            <p className="event-time p2">{eventTimestamp}</p>
          </button>
          {isSelected && isExpandable && (
            <>
              <p className="event-description p1">{shortMsg}</p>
              {hasLearnMore && (
                <Button
                  className="learn-more-button"
                  onClick={toggleLearnMore}
                  variant="secondary"
                >
                  {$content.learn_how_to_fix_it}
                </Button>
              )}
            </>
          )}
        </span>
      );
    }
  );
};

StreamEventsList.defaultProps = {
  isLive: false,
  selectedEventId: null,
  streamEvents: []
};

StreamEventsList.propTypes = {
  isLive: PropTypes.bool,
  selectedEventId: PropTypes.string,
  setSelectedEventId: PropTypes.func.isRequired,
  streamEvents: PropTypes.array,
  toggleLearnMore: PropTypes.func.isRequired
};

export default StreamEventsList;
