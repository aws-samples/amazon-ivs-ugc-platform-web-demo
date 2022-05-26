import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import { dashboard as $dashboardContent } from '../../../../../../content';
import { processEvents } from './utils';
import LearnMoreMessage from './LearnMoreMessage';
import MetricPanel from '../MetricPanel';
import StreamEventsList from './StreamEventsList';
import './StreamEvents.css';

const $content = $dashboardContent.stream_session_page.stream_events;

const StreamEvents = () => {
  const { activeStreamSession } = useOutletContext();
  const { isLive, truncatedEvents } = activeStreamSession || {};
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [isLearnMoreVisible, setIsLearnMoreVisible] = useState(false);
  const streamEvents = useMemo(
    () => processEvents(truncatedEvents),
    [truncatedEvents]
  );
  const selectedEvent = useMemo(
    () => streamEvents.find(({ id }) => id === selectedEventId),
    [selectedEventId, streamEvents]
  );
  const toggleLearnMore = useCallback(() => {
    setIsLearnMoreVisible((prev) => !prev);
  }, []);

  useEffect(() => {
    setIsLearnMoreVisible(false);
    setSelectedEventId(null);
  }, [activeStreamSession?.streamId]);

  return (
    <div className={`stream-events ${isLearnMoreVisible ? 'learn-more' : ''}`}>
      {isLearnMoreVisible && (
        <LearnMoreMessage
          event={selectedEvent}
          toggleLearnMore={toggleLearnMore}
        />
      )}
      <MetricPanel
        title={$content.stream_events}
        headerClassNames={['stream-events-header']}
        wrapper={{ classNames: ['stream-events-list'] }}
      >
        {!!truncatedEvents?.length ? (
          <StreamEventsList
            isLive={isLive}
            selectedEventId={selectedEventId}
            setSelectedEventId={setSelectedEventId}
            streamEvents={streamEvents}
            toggleLearnMore={toggleLearnMore}
          />
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
