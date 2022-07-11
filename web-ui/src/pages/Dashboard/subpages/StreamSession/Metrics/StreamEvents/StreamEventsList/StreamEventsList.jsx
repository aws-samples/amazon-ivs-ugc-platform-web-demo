import PropTypes from 'prop-types';
import { useCallback, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';

import { Close } from '../../../../../../../assets/icons';
import { dashboard as $dashboardContent } from '../../../../../../../content';
import { useMobileBreakpoint } from '../../../../../../../contexts/MobileBreakpoint';
import Button from '../../../../../../../components/Button';
import MetricPanel from '../../MetricPanel';
import StreamEventItem from './StreamEventItem';
import './StreamEventsList.css';

const $content = $dashboardContent.stream_session_page.stream_events;

const StreamEventsList = ({
  isHidden,
  isLearnMoreVisible,
  isPreview,
  selectedEventId,
  setIsStreamEventsListVisible,
  setSelectedEventId,
  streamEvents,
  toggleLearnMore
}) => {
  const { isDefaultResponsiveView } = useMobileBreakpoint();
  const { activeStreamSession = {}, isLoadingStreamData } = useOutletContext();
  const wrapperRef = useRef();
  const selectedEventRef = useRef();
  const setSelectedEventRef = useCallback(
    (eventEl) => {
      const eventId = eventEl?.attributes['data-id'].value;
      if (eventId === selectedEventId) selectedEventRef.current = eventEl;
    },
    [selectedEventId]
  );

  const handleEventClick = (id) => {
    setSelectedEventId((prevId) => {
      if (prevId === id) {
        selectedEventRef.current = null;
        return null;
      }

      return id;
    });
  };

  const handleCloseEventsList = () => {
    setIsStreamEventsListVisible(false);
    setSelectedEventId(null);
  };

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

  useEffect(() => {
    const removeSpacebarScroll = (e) => {
      if (e.keyCode === 32) e.preventDefault(); // keyCode 32 => Spacebar
    };

    const wrapper = wrapperRef.current;
    wrapper?.addEventListener('keypress', removeSpacebarScroll);

    return () => wrapper?.removeEventListener('keypress', removeSpacebarScroll);
  }, []);

  const hasEvents = !!streamEvents.length;
  const metricPanelWrapperClasses = ['stream-events-list'];
  if (!hasEvents) metricPanelWrapperClasses.push('no-stream-events-wrapper');

  return (
    <MetricPanel
      hasData={hasEvents && !isLoadingStreamData}
      isLoading={isLoadingStreamData}
      style={isHidden ? { display: 'none' } : {}}
      title={$content.stream_events}
      header={
        isDefaultResponsiveView &&
        !isPreview && (
          <Button
            className="close-events-list-btn"
            onClick={handleCloseEventsList}
            variant="icon"
          >
            <Close className="close-icon" />
          </Button>
        )
      }
      headerClassNames={['stream-events-header']}
      ref={wrapperRef}
      wrapper={{ classNames: metricPanelWrapperClasses }}
    >
      {hasEvents ? (
        streamEvents.map((streamEvent) => (
          <StreamEventItem
            key={streamEvent.id}
            handleEventClick={handleEventClick}
            isLive={activeStreamSession.isLive}
            selectedEventId={selectedEventId}
            setSelectedEventRef={setSelectedEventRef}
            streamEvent={streamEvent}
            toggleLearnMore={toggleLearnMore}
            isLearnMoreVisible={isLearnMoreVisible}
          />
        ))
      ) : (
        <span className="no-stream-events">
          <h4>{$content.no_stream_events}</h4>
          <p className="p2">{$content.no_stream_events_message}</p>
        </span>
      )}
    </MetricPanel>
  );
};

StreamEventsList.defaultProps = {
  isHidden: false,
  isLearnMoreVisible: false,
  isPreview: false,
  selectedEventId: null,
  setIsStreamEventsListVisible: () => {},
  streamEvents: []
};

StreamEventsList.propTypes = {
  isHidden: PropTypes.bool,
  isLearnMoreVisible: PropTypes.bool,
  isPreview: PropTypes.bool,
  selectedEventId: PropTypes.string,
  setIsStreamEventsListVisible: PropTypes.func,
  setSelectedEventId: PropTypes.func.isRequired,
  streamEvents: PropTypes.array,
  toggleLearnMore: PropTypes.func.isRequired
};

export default StreamEventsList;
