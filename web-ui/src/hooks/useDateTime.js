import { useEffect, useRef, useState } from 'react';

import { app as $appContent } from '../content';

const $content = $appContent.date_time;
const ONE_MINUTE_IN_SECONDS = 60;
const ONE_HOUR_IN_SECONDS = ONE_MINUTE_IN_SECONDS * 60;
const ONE_DAY_IN_SECONDS = ONE_HOUR_IN_SECONDS * 24;
const ONE_DAY_IN_MILLISECONDS = ONE_DAY_IN_SECONDS * 1000;

export const getDayDiff = (d1, d2 = new Date()) => {
  const normalize = (date) => {
    const _date = new Date(date);
    _date.setHours(0, 0, 0, 0);
    return _date;
  };

  const getTimezoneOffsetInMs = (date) => {
    const utcDate = new Date(
      Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
        date.getMilliseconds()
      )
    );
    utcDate.setUTCFullYear(date.getFullYear());

    return date.getTime() - utcDate.getTime();
  };

  const d1Normalized = normalize(d1);
  const d2Normalized = normalize(d2);
  const d1Timestamp =
    d1Normalized.getTime() - getTimezoneOffsetInMs(d1Normalized);
  const d2Timestamp =
    d2Normalized.getTime() - getTimezoneOffsetInMs(d2Normalized);

  return Math.round(
    Math.abs(d1Timestamp - d2Timestamp) / ONE_DAY_IN_MILLISECONDS
  );
};

export const formatDate = (utcDate) => {
  const [weekday, month, day, year] = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
    year: 'numeric'
  })
    .formatToParts(new Date(utcDate))
    .filter((part) => part.type !== 'literal')
    .map((part) => part.value);

  return `${weekday} ${month} ${day}, ${year}`;
};

export const formatTime = (utcStartDate, utcEndDate) => {
  const formatAbsoluteTime = (date) =>
    new Intl.DateTimeFormat('en-US', { timeStyle: 'short' })
      .format(new Date(date))
      .replace(/ /g, '');

  const formatRelativeTime = (date) => {
    const timeInSec = new Date(date).getTime() / 1000;
    const nowInSec = Date.now() / 1000;
    const diffInSec = nowInSec - timeInSec;
    let relativeValue = '';
    let relativeUnit = '';

    if (diffInSec >= ONE_DAY_IN_SECONDS) {
      relativeValue = Math.floor(diffInSec / ONE_DAY_IN_SECONDS);
      relativeUnit = relativeValue === 1 ? 'day' : 'days';
    } else if (diffInSec >= ONE_HOUR_IN_SECONDS) {
      relativeValue = Math.floor(diffInSec / ONE_HOUR_IN_SECONDS);
      relativeUnit = relativeValue === 1 ? 'hour' : 'hours';
    } else if (diffInSec >= ONE_MINUTE_IN_SECONDS) {
      relativeValue = Math.floor(diffInSec / ONE_MINUTE_IN_SECONDS);
      relativeUnit = relativeValue === 1 ? 'minute' : 'minutes';
    }

    return diffInSec < 60
      ? $content.just_now
      : new Intl.RelativeTimeFormat('en', {
          numeric: 'always',
          style: 'long'
        }).format(-relativeValue, relativeUnit);
  };

  return !!utcEndDate
    ? `${formatAbsoluteTime(utcStartDate)} - ${formatAbsoluteTime(utcEndDate)}`
    : `${$content.started} ${formatRelativeTime(utcStartDate)}`;
};

export const useDateTime = (
  startTime,
  endTime,
  isLive,
  updateIntervalInSeconds
) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [dayDiff, setDayDiff] = useState('');
  const intervalId = useRef();

  useEffect(() => {
    if (!startTime) return;

    const update = () => {
      const newDate = formatDate(startTime);
      const newTime = formatTime(startTime, endTime);
      const newDayDiff = !isLive && getDayDiff(startTime, endTime);

      setDate(newDate);
      setTime(newTime);
      setDayDiff(newDayDiff);
    };

    update();
    if (isLive) {
      intervalId.current = setInterval(update, updateIntervalInSeconds * 1000);
    }

    return () => clearInterval(intervalId.current);
  }, [endTime, isLive, startTime, updateIntervalInSeconds]);

  return [date, time, dayDiff];
};

export default useDateTime;
