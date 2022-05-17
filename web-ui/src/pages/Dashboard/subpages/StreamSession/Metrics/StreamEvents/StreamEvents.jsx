import { dashboard as $dashboardContent } from '../../../../../../content';
import Panel from '../MetricsPanel';
import Button from '../../../../../../components/Button';
import './StreamEvents.css';

const $content = $dashboardContent.stream_session_page.stream_events;

const TEST_STREAM_EVENTS_COUNT = 20;

const TestStreamEventsList = () =>
  [...new Array(TEST_STREAM_EVENTS_COUNT)].map((_, index) => (
    <span
      key={index}
      style={{
        background: index === 1 ? 'var(--color-medium-gray)' : 'transparent',
        borderRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        marginBottom: '1rem',
        justifyContent: 'center',
        padding: '15px',
        rowGap: '5px'
      }}
    >
      <p
        style={{
          fontWeight: 500,
          fontSize: '15px',
          color: index === 1 ? 'var(--color-red)' : 'var(--color-white)'
        }}
      >
        Stream Event {index}
      </p>
      <p
        style={{
          color: 'var(--color-light-gray)',
          fontWeight: 400,
          fontSize: '13px'
        }}
      >
        Tamago
      </p>
      {index === 1 && (
        <p style={{ lineHeight: '22.5px', padding: '10px 0 30px 0' }}>
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
