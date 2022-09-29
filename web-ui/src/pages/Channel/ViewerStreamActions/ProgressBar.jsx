import PropTypes from 'prop-types';

import { bound, clsm } from '../../../utils';
import { useEffect, useRef, useCallback } from 'react';

const ProgressBar = ({ color, duration, onCompletion, startTime }) => {
  const durationInMs = duration * 1000;
  const remainingTimeRef = useRef(null);
  const intervalIdRef = useRef();

  const commonClasses = ['rounded-full', 'h-1.5'];

  const updateWidth = useCallback(
    (remainingTime) => {
      const width = (remainingTime / durationInMs) * 100;

      return `${width}%`;
    },
    [durationInMs]
  );

  useEffect(() => {
    const updateRemainingTime = () => {
      const now = Date.now();
      const differenceInMs = now - startTime;
      const remainingTimeInMs = durationInMs - differenceInMs;

      if (differenceInMs >= durationInMs) {
        clearInterval(intervalIdRef.current);
        setTimeout(() => onCompletion(), 2000);
      }

      remainingTimeRef.current.style.width = updateWidth(
        bound(remainingTimeInMs, 0)
      );
    };

    intervalIdRef.current = setInterval(updateRemainingTime, 50);

    return () => clearInterval(intervalIdRef.current);
  }, [durationInMs, onCompletion, startTime, updateWidth]);

  return (
    <div
      className={clsm([
        commonClasses,
        'w-full',
        `bg-profile-${color || 'default'}-dark`
      ])}
    >
      <div
        ref={remainingTimeRef}
        className={clsm([
          commonClasses,
          'transition-[width]',
          `bg-profile-${color || 'default'}-extraLight`
        ])}
      ></div>
    </div>
  );
};

ProgressBar.defaultProps = {
  color: 'default',
  duration: 10
};

ProgressBar.propTypes = {
  color: PropTypes.string,
  duration: PropTypes.number,
  onCompletion: PropTypes.func.isRequired,
  startTime: PropTypes.number.isRequired
};

export default ProgressBar;
