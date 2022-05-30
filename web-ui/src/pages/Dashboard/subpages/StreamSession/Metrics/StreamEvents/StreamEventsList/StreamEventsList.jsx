import PropTypes from 'prop-types';
import { useCallback, useEffect, useRef } from 'react';

import StreamEventItem from './StreamEventItem';
import './StreamEventsList.css';

const StreamEventsList = ({
  isLive,
  selectedEventId,
  setSelectedEventId,
  streamEvents,
  toggleLearnMore
}) => {
  const selectedEventRef = useRef();
  const setSelectedEventRef = useCallback(
    (eventEl) => {
      const eventId = eventEl?.attributes['data-id'].value;
      if (eventId === selectedEventId) selectedEventRef.current = eventEl;
    },
    [selectedEventId]
  );

  useEffect(() => {
    setTimeout(
      () =>
        selectedEventRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        }),
      300
    );
  }, [selectedEventId]);

  const handleEventClick = ({ target }, id) => {
    setSelectedEventId((prevId) => {
      if (prevId === id) {
        selectedEventRef.current = null;
        return null;
      }

      return id;
    });
  };

  return streamEvents.map((streamEvent) => (
    <StreamEventItem
      key={streamEvent.id}
      handleEventClick={handleEventClick}
      isLive={isLive}
      selectedEventId={selectedEventId}
      setSelectedEventRef={setSelectedEventRef}
      streamEvent={streamEvent}
      toggleLearnMore={toggleLearnMore}
    />
  ));
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
