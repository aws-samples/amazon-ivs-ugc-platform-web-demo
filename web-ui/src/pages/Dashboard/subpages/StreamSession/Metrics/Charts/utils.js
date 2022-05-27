import { INGEST_VIDEO_BITRATE } from '../../../../../../constants';
import { formatTime } from '../../../../../../hooks/useDateTime';

export const convertMetricValue = (value, label) => {
  switch (label) {
    case INGEST_VIDEO_BITRATE: {
      if (typeof value === 'number') {
        // Convert from bps to mbps
        return value * Math.pow(10, -6);
      } else return value;
    }
    default:
      return value;
  }
};

export const processMetricData = ({
  alignedStartTime,
  data,
  label,
  period
}) => {
  if (!data || !period || !alignedStartTime) return [];

  let currentTime = new Date(alignedStartTime).getTime();
  const intervalMs = period * 1000;

  return data.map((value) => ({
    timestamp: (currentTime += intervalMs),
    value: convertMetricValue(value, label)
  }));
};

const formatMetricDate = (timestamp) => {
  const formattedDate = Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short'
  }).format(timestamp);
  const formattedTime = formatTime(timestamp, null, false);

  return `${formattedDate} ${formattedTime}`;
};

export const ingestVideoBitrateTooltipFormatter = ({ timestamp, value }) => {
  const formattedTimestamp = formatMetricDate(timestamp);

  const formattedValue = `${value.toFixed(1)} mbps`;

  return { timestamp: formattedTimestamp, value: formattedValue };
};

export const ingestFramerateTooltipFormatter = ({ timestamp, value }) => {
  const formattedTimestamp = formatMetricDate(timestamp);

  const formattedValue = `${value.toFixed(0)} fps`;

  return { timestamp: formattedTimestamp, value: formattedValue };
};
