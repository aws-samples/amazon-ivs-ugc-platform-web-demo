import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

const getTimeDiff = (dateTimeString) => {
  if (!dateTimeString) return 0;

  const dateTime = new Date(dateTimeString);
  const now = new Date();
  const diff = now - dateTime;

  return diff;
};

const TimeElapsed = () => {
  const { activeStreamSession = {} } = useOutletContext();
  const { startTime } = activeStreamSession;
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    const updateTimeElapsed = () => {
      setTimeElapsed((prevTimeElapsed) => {
        const newTimeElapsed = getTimeDiff(startTime);

        if (newTimeElapsed >= prevTimeElapsed + 1000) {
          return newTimeElapsed;
        }

        return prevTimeElapsed;
      });
    };
    const intervalId = setInterval(updateTimeElapsed, 100);

    return () => clearInterval(intervalId);
  }, [startTime]);

  return new Date(timeElapsed).toISOString().slice(11, 19);
};

export default TimeElapsed;
