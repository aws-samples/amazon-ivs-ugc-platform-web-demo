import { useCallback, useRef } from 'react';

import useLatest from './useLatest';

const useAnimationFrame = (callback) => {
  const startTime = useRef(0);
  const latestCallback = useLatest(callback);

  const start = useCallback(
    (duration) =>
      new Promise((resolve) => {
        const animate = (timestamp) => {
          const elapsedTime = timestamp - startTime.current;
          latestCallback.current(Math.min(elapsedTime / duration, 1));

          if (elapsedTime >= duration) return resolve();

          requestAnimationFrame(animate);
        };

        requestAnimationFrame((timestamp) => {
          startTime.current = timestamp;
          animate(timestamp);
        });
      }),
    [latestCallback]
  );

  return { start };
};

export default useAnimationFrame;
