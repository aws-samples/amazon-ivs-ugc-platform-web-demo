import { extent } from 'd3-array';
import { scaleTime, scaleLinear } from '@visx/scale';

import { INGEST_VIDEO_BITRATE } from '../../../../../constants';
import { formatTime } from '../../../../../hooks/useDateTime';

// accessors
export const getDate = ({ timestamp }) => timestamp;
export const getDataValue = ({ value }) => value;

// scales
export const getXScale = (width, data) =>
  scaleTime({
    range: [0, width],
    domain: extent(data, getDate)
  });

export const getYScale = (height, maximum) =>
  scaleLinear({
    range: [height, 0],
    domain: [0, 1.2 * maximum || 0],
    nice: false
  });

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

  const currentTime = new Date(alignedStartTime).getTime();
  const intervalMs = period * 1000;

  return data.map((value, index) => ({
    timestamp: currentTime + index * intervalMs,
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

export const getBoundRelativeTimes = (zoomBounds, startTime, dataPeriod) => {
  const [lowerBound, upperBound] = zoomBounds;
  const timestamp = new Date(startTime).getTime();
  const relativeStartTime = timestamp + lowerBound * dataPeriod * 1000;
  const relativeEndTime = timestamp + upperBound * dataPeriod * 1000;

  return [relativeStartTime, relativeEndTime];
};

export const generateEventMarkers = (eventsToDisplay) =>
  eventsToDisplay.reduce((acc, { name, relativeEventTime }) => {
    acc.push({
      type: 'line',
      timestamp: relativeEventTime
    });

    if (name === 'Starvation Start') {
      return [
        ...acc,
        {
          type: 'gradient',
          startTimestamp: relativeEventTime
        }
      ];
    } else if (name === 'Starvation End') {
      // Look for the previous gradient if it exists
      const existingGradient = [...acc]
        .reverse()
        .find(
          ({ startTimestamp, type }) => type === 'gradient' && startTimestamp
        );

      if (existingGradient) {
        existingGradient.endTimestamp = relativeEventTime;
      } else {
        return [
          ...acc,
          {
            type: 'gradient',
            endTimestamp: relativeEventTime
          }
        ];
      }
    }

    return acc;
  }, []);
