import { dashboard as $dashboardContent } from '../../../../content';

const $content = $dashboardContent.header.session_navigator;

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
    } else {
      relativeValue = Math.floor(diffInSec);
      relativeUnit = relativeValue === 1 ? 'second' : 'seconds';
    }

    return new Intl.RelativeTimeFormat('en', {
      numeric: 'always',
      style: 'long'
    }).format(-relativeValue, relativeUnit);
  };

  return utcEndDate
    ? `${formatAbsoluteTime(utcStartDate)} - ${formatAbsoluteTime(utcEndDate)}`
    : `${$content.started} ${formatRelativeTime(utcStartDate)}`;
};

export const groupStreamSessions = (streamSessions) => {
  const todaySessionGroup = {
    groupLabel: $content.session_group_labels.today,
    sessionData: []
  };
  const previous7DaysSessionGroup = {
    groupLabel: $content.session_group_labels.previous_7_days,
    sessionData: []
  };
  const previous30DaysSessionGroup = {
    groupLabel: $content.session_group_labels.previous_30_days,
    sessionData: []
  };
  const earlierDaysSessionGroup = {
    groupLabel: $content.session_group_labels.earlier,
    sessionData: []
  };

  streamSessions.forEach((streamSession) => {
    const dayDiff = getDayDiff(streamSession.startTime);

    if (dayDiff < 1) {
      todaySessionGroup.sessionData.push(streamSession); // "Today"
    } else if (dayDiff < 8) {
      previous7DaysSessionGroup.sessionData.push(streamSession); // "Previous 7 days"
    } else if (dayDiff < 31) {
      previous30DaysSessionGroup.sessionData.push(streamSession); // "Previous 30 days"
    } else {
      earlierDaysSessionGroup.sessionData.push(streamSession); // "Earlier"
    }
  });

  return [
    todaySessionGroup,
    previous7DaysSessionGroup,
    previous30DaysSessionGroup,
    earlierDaysSessionGroup
  ].filter(({ sessionData }) => sessionData.length);
};
