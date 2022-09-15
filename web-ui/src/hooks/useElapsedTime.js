import { useEffect, useState } from 'react';

const formatTime = (timeInMs) => {
  const seconds = Math.floor((timeInMs / 1000) % 60);
  const minutes = Math.floor((timeInMs / (1000 * 60)) % 60);
  const hours = Math.floor(timeInMs / (1000 * 60 * 60));
  const padNum = (num) => num.toString().padStart(2, '0');

  return `${padNum(hours)}:${padNum(minutes)}:${padNum(seconds)}`;
};

const getDuration = (startTime) => {
  const startDate = new Date(startTime);
  const startDateInMs = startDate.getTime();
  const endDateInMs = Date.now();

  return Math.abs(endDateInMs - startDateInMs);
};

const useElapsedTime = (startTime) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!startTime) return setElapsedTime(0);

    const updateElapsedTime = () => setElapsedTime(getDuration(startTime));
    updateElapsedTime();
    const intervalId = setInterval(updateElapsedTime, 1000);

    return () => clearInterval(intervalId);
  }, [startTime]);

  return formatTime(elapsedTime);
};

export default useElapsedTime;
