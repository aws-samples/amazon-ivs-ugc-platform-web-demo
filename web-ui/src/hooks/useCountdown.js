import { useEffect, useState } from 'react';

import { bound, noop } from '../utils';
import useLatest from './useLatest';

const defaultFormatter = (timeInMs) => timeInMs;

const getTimeLeft = (expiry) => {
  const endDate = new Date(expiry);
  const endDateInMs = endDate.getTime();
  const startDateInMs = Date.now();

  return endDateInMs - startDateInMs;
};

const useCountdown = ({
  expiry,
  formatter = defaultFormatter,
  isEnabled = true,
  onExpiry = noop,
  updateInterval = 100
}) => {
  const [timeLeft, setTimeLeft] = useState(formatter(0));
  const latestOnExpiry = useLatest(onExpiry);
  const latestFormatter = useLatest(formatter);

  useEffect(() => {
    if (!isEnabled) return;

    const hasExpired = new Date().toISOString() > expiry;
    if (!expiry || hasExpired) return setTimeLeft(latestFormatter.current(0));

    const updateTimeLeft = () => {
      const timeLeftInMs = bound(getTimeLeft(expiry), 0);

      if (timeLeftInMs === 0) {
        clearInterval(intervalId);
        latestOnExpiry.current();
      }

      setTimeLeft(latestFormatter.current(timeLeftInMs));
    };
    updateTimeLeft();
    const intervalId = setInterval(updateTimeLeft, 100);

    return () => clearInterval(intervalId);
  }, [expiry, isEnabled, latestFormatter, latestOnExpiry]);

  return timeLeft;
};

export default useCountdown;
