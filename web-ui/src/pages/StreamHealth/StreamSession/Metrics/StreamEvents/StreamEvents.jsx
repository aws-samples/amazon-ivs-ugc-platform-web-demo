import { useCallback, useEffect, useMemo, useState } from 'react';

import './StreamEvents.css';
import { dashboard as $dashboardContent } from '../../../../../content';
import { processEvents } from './utils';
import { clsm, scrollToTop } from '../../../../../utils';
import { useResponsiveDevice } from '../../../../../contexts/ResponsiveDevice';
import { useStreams } from '../../../../../contexts/Streams';
import Button from '../../../../../components/Button';
import LearnMoreMessage from './LearnMoreMessage';
import ResponsivePanel from '../../../../../components/ResponsivePanel';
import StreamEventsList from './StreamEventsList';

const $content = $dashboardContent.stream_session_page.stream_events;

const DEFAULT_RESPONSIVE_PANEL_CONTAINER_CLASSES = clsm([
  'h-[calc(100%_-_64px)]',
  'top-16'
]);
const EVENT_PREVIEW_COUNT = 2;

const StreamEvents = () => {
  const { isDefaultResponsiveView } = useResponsiveDevice();
  const { activeStreamSession = {} } = useStreams();
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

  const toggleLearnMore = useCallback(
    (forceSet) => {
      setIsLearnMoreVisible((prev) => {
        let next = !prev;

        if (forceSet === true || forceSet === false) {
          next = forceSet;
        }

        if (!isDefaultResponsiveView) {
          if (next) setTimeout(() => setIsStreamEventsListVisible(false), 250);
          else setIsStreamEventsListVisible(true);
        }

        return next;
      });
    },
    [isDefaultResponsiveView]
  );

  useEffect(() => {
    setIsStreamEventsListVisible(!isDefaultResponsiveView);
    setIsLearnMoreVisible(false);
    setSelectedEventId(null);
    scrollToTop('.stream-events-list', 'auto');
  }, [activeStreamSession.streamId, isDefaultResponsiveView]);

  return (
    <div className={clsm(['stream-events', 'rounded-3xl', 'md:space-y-4'])}>
      <ResponsivePanel
        containerClasses={DEFAULT_RESPONSIVE_PANEL_CONTAINER_CLASSES}
        isOpen={!isDefaultResponsiveView || isStreamEventsListVisible}
        panelId="stream-events-panel"
      >
        <StreamEventsList
          isHidden={!isStreamEventsListVisible}
          isLearnMoreVisible={isLearnMoreVisible}
          selectedEventId={selectedEventId}
          setIsStreamEventsListVisible={setIsStreamEventsListVisible}
          setSelectedEventId={setSelectedEventId}
          streamEvents={streamEvents}
          toggleLearnMore={toggleLearnMore}
        />
      </ResponsivePanel>
      <ResponsivePanel
        containerClasses={DEFAULT_RESPONSIVE_PANEL_CONTAINER_CLASSES}
        isOpen={isLearnMoreVisible}
        panelId="learn-more-panel"
      >
        <LearnMoreMessage
          event={selectedEvent}
          toggleLearnMore={toggleLearnMore}
        />
      </ResponsivePanel>
      {isDefaultResponsiveView && (
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
              className="mx-auto"
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
