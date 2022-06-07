import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import { dashboard as $dashboardContent } from '../../../../../../content';
import { processEvents } from './utils';
import { scrollToTop } from '../../../../../../utils';
import { useMobileBreakpoint } from '../../../../../../contexts/MobileBreakpoint';
import Button from '../../../../../../components/Button';
import LearnMoreMessage from './LearnMoreMessage';
import ResponsivePanel from '../../../../../../components/ResponsivePanel';
import StreamEventsList from './StreamEventsList';
import './StreamEvents.css';

const $content = $dashboardContent.stream_session_page.stream_events;

const EVENT_PREVIEW_COUNT = 2;

const StreamEvents = () => {
  const { isMobileView } = useMobileBreakpoint();
  const { activeStreamSession = {} } = useOutletContext();
  const [isLearnMoreVisible, setIsLearnMoreVisible] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [isStreamEventsListVisible, setIsStreamEventsListVisible] = useState();

  const streamEvents = useMemo(
    () => processEvents(activeStreamSession.truncatedEvents),
    [activeStreamSession.truncatedEvents]
  );
  const selectedEvent = useMemo(
    () => streamEvents.find(({ id }) => id === selectedEventId),
    [selectedEventId, streamEvents]
  );

  const toggleLearnMore = useCallback(() => {
    setIsLearnMoreVisible((prev) => {
      if (!isMobileView) {
        if (prev) setIsStreamEventsListVisible(true);
        else setTimeout(() => setIsStreamEventsListVisible(false), 250);
      }

      return !prev;
    });
  }, [isMobileView]);

  useEffect(() => {
    setIsStreamEventsListVisible(!isMobileView);
    setIsLearnMoreVisible(false);
    setSelectedEventId(null);
    scrollToTop('.stream-events-list', 'auto');
  }, [activeStreamSession.streamId, isMobileView]);

  return (
    <div className="stream-events">
      <ResponsivePanel isOpen={isLearnMoreVisible}>
        <LearnMoreMessage
          event={selectedEvent}
          toggleLearnMore={toggleLearnMore}
        />
      </ResponsivePanel>
      <ResponsivePanel isOpen={!isMobileView || isStreamEventsListVisible}>
        <StreamEventsList
          isHidden={!isStreamEventsListVisible}
          selectedEventId={selectedEventId}
          setIsStreamEventsListVisible={setIsStreamEventsListVisible}
          setSelectedEventId={setSelectedEventId}
          streamEvents={streamEvents}
          toggleLearnMore={toggleLearnMore}
        />
      </ResponsivePanel>
      {isMobileView && (
        <>
          <StreamEventsList
            isPreview
            selectedEventId={selectedEventId}
            setSelectedEventId={setSelectedEventId}
            streamEvents={streamEvents.slice(0, EVENT_PREVIEW_COUNT)}
            toggleLearnMore={toggleLearnMore}
          />
          {streamEvents.length > EVENT_PREVIEW_COUNT && (
            <Button
              onClick={() => setIsStreamEventsListVisible(true)}
              className="view-all-events-btn"
              variant="secondary"
            >
              {$content.view_all_events}
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default StreamEvents;
