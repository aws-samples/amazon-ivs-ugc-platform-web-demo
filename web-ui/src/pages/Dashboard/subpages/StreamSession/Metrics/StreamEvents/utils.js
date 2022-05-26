import {
  dashboard as $dashboardContent,
  longEventMessages,
  shortEventMessages
} from '../../../../../../content';

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
  {
    type: 'none',
    key: 'Stream End',
    name: $content.event_names.stream_end
  },
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
    shortMsg: shortEventMessages.stream_failure,
    longMsg: longEventMessages.stream_failure
  },
  {
    type: 'error',
    key: 'Starvation Start',
    name: $content.event_names.starvation_start,
    shortMsg: shortEventMessages.starvation_start,
    longMsg: longEventMessages.starvation_start
  },
  {
    type: 'error',
    key: 'Ingest Bitrate',
    name: $content.event_names.ingest_bitrate,
    shortMsg: shortEventMessages.ingest_bitrate,
    longMsg: longEventMessages.ingest_bitrate
  },
  {
    type: 'error',
    key: 'Ingest Resolution',
    name: $content.event_names.ingest_resolution,
    shortMsg: shortEventMessages.ingest_resolution,
    longMsg: longEventMessages.ingest_resolution
  },
  {
    type: 'error',
    key: 'Concurrent Broadcasts',
    name: $content.event_names.concurrent_broadcasts,
    shortMsg: shortEventMessages.concurrent_broadcasts,
    longMsg: longEventMessages.concurrent_broadcasts
  },
  {
    type: 'error',
    key: 'Concurrent Viewers',
    name: $content.event_names.concurrent_viewers,
    shortMsg: shortEventMessages.concurrent_viewers,
    longMsg: longEventMessages.concurrent_viewers
  },
  {
    type: 'error',
    key: 'Recording Start Failure',
    name: $content.event_names.recording_start_failure,
    shortMsg: shortEventMessages.recording_start_failure,
    longMsg: longEventMessages.recording_start_failure
  },
  {
    type: 'error',
    key: 'Recording End Failure',
    name: $content.event_names.recording_end_failure,
    shortMsg: shortEventMessages.recording_end_failure,
    longMsg: longEventMessages.recording_end_failure
  }
];

export const processEvents = (events = []) =>
  events.map((event) => {
    const { type, name, longMsg, shortMsg } =
      STREAM_EVENT_MAP.find(({ key }) => event.name === key) || {};

    if (type === 'error') event.error = true;
    if (type === 'success') event.success = true;

    return { ...event, name, shortMsg, longMsg };
  });
