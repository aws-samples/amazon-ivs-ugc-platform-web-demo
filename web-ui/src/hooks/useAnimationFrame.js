import { useCallback, useRef } from 'react';

import useLatest from './useLatest';

const linear = (progress) => progress;

const useAnimationFrame = (callback, ease = linear) => {
  const startTime = useRef(0);
  const latestCallback = useLatest(callback);
  const latestEase = useLatest(ease);

  const start = useCallback(
    (duration) =>
      new Promise((resolve) => {
        const animate = (timestamp) => {
          const elapsedTime = timestamp - startTime.current;
          const progress =
            duration > 0 ? Math.min(elapsedTime / duration, 1) : 1;
          const easedProgress = latestEase.current(progress);

          latestCallback.current(easedProgress);

          if (elapsedTime >= duration) return resolve();

          requestAnimationFrame(animate);
        };

        requestAnimationFrame((timestamp) => {
          startTime.current = timestamp;
          animate(timestamp);
        });
      }),
    [latestCallback, latestEase]
  );

  return { start };
};

export default useAnimationFrame;
