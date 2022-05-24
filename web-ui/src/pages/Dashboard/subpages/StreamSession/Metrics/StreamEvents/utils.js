import { dashboard as $dashboardContent } from '../../../../../../content';

const $content = $dashboardContent.stream_session_page.stream_events;

const STREAM_EVENT_MAP = [
  {
    type: 'none',
    key: 'Session Created',
    name: $content.event_names.session_created
  },
  {
    type: 'none',
    key: 'Session Ended',
    name: $content.event_names.session_ended
  },
  {
    type: 'none',
    key: 'Stream Start',
    name: $content.event_names.stream_start
  },
  { type: 'none', key: 'Stream End', name: $content.event_names.stream_end },
  {
    type: 'none',
    key: 'Recording Start',
    name: $content.event_names.recording_start
  },
  {
    type: 'none',
    key: 'Recording End',
    name: $content.event_names.recording_end
  },
  {
    type: 'success',
    key: 'Starvation End',
    name: $content.event_names.starvation_end
  },
  {
    type: 'error',
    key: 'Stream Failure',
    name: $content.event_names.stream_failure,
    shortMsg: $content.event_messages.short.stream_failure,
    longMsg: ''
  },
  {
    type: 'error',
    key: 'Starvation Start',
    name: $content.event_names.starvation_start,
    shortMsg: $content.event_messages.short.starvation_start,
    longMsg: ''
  },
  {
    type: 'error',
    key: 'Ingest Bitrate',
    name: $content.event_names.ingest_bitrate,
    shortMsg: $content.event_messages.short.ingest_bitrate,
    longMsg: ''
  },
  {
    type: 'error',
    key: 'Ingest Resolution',
    name: $content.event_names.ingest_resolution,
    shortMsg: $content.event_messages.short.ingest_resolution,
    longMsg: ''
  },
  {
    type: 'error',
    key: 'Concurrent Broadcasts',
    name: $content.event_names.concurrent_broadcasts,
    shortMsg: $content.event_messages.short.concurrent_broadcasts,
    longMsg: ''
  },
  {
    type: 'error',
    key: 'Concurrent Viewers',
    name: $content.event_names.concurrent_viewers,
    shortMsg: $content.event_messages.short.concurrent_viewers,
    longMsg: ''
  },
  {
    type: 'error',
    key: 'Recording Start Failure',
    name: $content.event_names.recording_start_failure,
    shortMsg: $content.event_messages.short.recording_start_failure,
    longMsg: ''
  },
  {
    type: 'error',
    key: 'Recording End Failure',
    name: $content.event_names.recording_end_failure,
    shortMsg: $content.event_messages.short.recording_end_failure,
    longMsg: ''
  }
];

export const processEvents = (events = []) =>
  events.map((event) => {
    const { type, name, longMsg, shortMsg } =
      STREAM_EVENT_MAP.find(({ key }) => event.name === key) || {};

    if (type === 'error') event.error = true;
    if (type === 'success') event.success = true;

    if (name) event.name = name;
    if (shortMsg) event.shortMsg = shortMsg;
    if (longMsg) event.longMsg = longMsg;

    return event;
  });
