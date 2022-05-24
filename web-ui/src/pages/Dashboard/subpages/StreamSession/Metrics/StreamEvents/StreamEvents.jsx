import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import { dashboard as $dashboardContent } from '../../../../../../content';
import { ErrorIcon, Check } from '../../../../../../assets/icons';
import { formatDate, formatTime } from '../../../../../../hooks/useDateTime';
import { processEvents } from './utils';
import Button from '../../../../../../components/Button';
import LearnMoreMessage from './LearnMoreMessage';
import MetricPanel from '../MetricPanel';
import './StreamEvents.css';

const $content = $dashboardContent.stream_session_page.stream_events;

const StreamEvents = () => {
  const { activeStreamSession } = useOutletContext();
  const { isLive, truncatedEvents } = activeStreamSession || {};
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [isLearnMoreVisible, setIsLearnMoreVisible] = useState(false);
  const selectedEventRef = useRef();
  const streamEvents = useMemo(
    () => processEvents(truncatedEvents),
    [truncatedEvents]
  );
  const selectedEvent = useMemo(
    () => streamEvents.find(({ id }) => id === selectedEventId),
    [selectedEventId, streamEvents]
  );

  const handleEventClick = ({ target }, id) => {
    setSelectedEventId((prevId) => {
      if (prevId === id) {
        selectedEventRef.current = null;
        return null;
      }

      return id;
    });
  };

  const toggleLearnMore = useCallback(() => {
    setIsLearnMoreVisible((prev) => !prev);
  }, []);

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

  return isLearnMoreVisible ? (
    <LearnMoreMessage event={selectedEvent} toggleLearnMore={toggleLearnMore} />
  ) : (
    <div className="stream-events">
      <MetricPanel
        title={$content.stream_events}
        headerClassNames={['stream-events-header']}
        wrapper={{ classNames: ['stream-events-list'] }}
      >
        {!!truncatedEvents?.length ? (
          streamEvents.map(
            ({ id, name, error, success, eventTime, shortMsg, longMsg }) => {
              const isSelected = id === selectedEventId;
              const isExpandable = !!shortMsg;
              const hasLearnMore = !!longMsg;
              const date = formatDate(eventTime);
              const time = formatTime(eventTime, null, isLive);
              let eventTimestamp = isLive ? time : `${date} ${time}`;
              eventTimestamp =
                eventTimestamp.charAt(0).toUpperCase() +
                eventTimestamp.slice(1);

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
          )
        ) : (
          <span className="no-stream-events">
            <h4>{$content.no_stream_events}</h4>
            <p className="p2">{$content.no_stream_events_message}</p>
          </span>
        )}
      </MetricPanel>
    </div>
  );
};

export default StreamEvents;
