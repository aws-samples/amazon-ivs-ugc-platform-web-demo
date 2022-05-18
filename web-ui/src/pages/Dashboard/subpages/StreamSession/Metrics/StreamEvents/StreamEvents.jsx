import { useOutletContext } from 'react-router-dom';

import { dashboard as $dashboardContent } from '../../../../../../content';
import Button from '../../../../../../components/Button';
import MetricPanel from '../MetricPanel';
import './StreamEvents.css';

const $content = $dashboardContent.stream_session_page.stream_events;

const TEST_STREAM_EVENTS_COUNT = 20;

const TestStreamEventsList = () =>
  [...new Array(TEST_STREAM_EVENTS_COUNT)].map((_, index) => (
    <span className={`event-item ${index === 1 ? 'selected' : ''}`} key={index}>
      <h4 className="event-name">Stream Event {index}</h4>
      <p className="event-time p2">Tamago</p>
      {index === 1 && (
        <p className="event-description p1">
          Your stream is experiencing performance or network issues. Please
          check your configuration settings and network connection.
        </p>
      )}
      {index === 1 && (
        <Button variant="secondary">{$content.learn_how_to_fix_it}</Button>
      )}
    </span>
  ));

const StreamEvents = () => {
  const { activeStreamSession } = useOutletContext();

  return (
    <div className="stream-events">
      <MetricPanel
        title={$content.stream_events}
        headerClassNames={['stream-events-header']}
        wrapper={{ classNames: ['stream-events-list'] }}
      >
        {activeStreamSession?.truncatedEvents?.length ? (
          <TestStreamEventsList />
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
