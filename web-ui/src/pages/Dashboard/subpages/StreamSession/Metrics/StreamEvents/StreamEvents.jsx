import { dashboard as $dashboardContent } from '../../../../../../content';
import Panel from '../MetricsPanel';
import Button from '../../../../../../components/Button';
import './StreamEvents.css';

const $content = $dashboardContent.stream_session_page.stream_events;

const TEST_STREAM_EVENTS_COUNT = 20;

const TestStreamEventsList = () =>
  [...new Array(TEST_STREAM_EVENTS_COUNT)].map((_, index) => (
    <span className={`event-item ${index === 1 ? 'selected' : ''}`} key={index}>
      <h4 className="event-name">Stream Event {index}</h4>
      <p className="event-time p2">Tamago</p>
      {index === 1 && (
        <p className="event-description">
          Your stream is experiencing performance or network issues. Please
          check your configuration settings and network connection.
        </p>
      )}
      {index === 1 && (
        <Button variant="secondary">{$content.learn_how_to_fix_it}</Button>
      )}
    </span>
  ));

const StreamEvents = () => (
  <div className="stream-events">
    <Panel
      title={$content.stream_events}
      headerClassNames={['stream-events-header']}
    >
      <div className="stream-events-list">
        <TestStreamEventsList />
      </div>
    </Panel>
  </div>
);

export default StreamEvents;
