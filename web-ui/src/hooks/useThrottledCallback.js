import { useCallback, useEffect, useRef } from 'react';

import useLatest from './useLatest';

/**
 * Creates a throttled function that only invokes callback at most once per every wait milliseconds.
 * The throttled function comes with a cancel method to cancel delayed callback invocations. The
 * throttled function is invoked predictably, so it is guaranteed to be invoked at least once,
 * granted that the cancel method is not called. Throttling a function prevents excessive or
 * repeated calling of the function (i.e. acts as a rate limiter for the execution of callbacks).
 * @param {func} callback function to throttle
 * @param {number} wait number of milliseconds to throttle invocations to
 */
const useThrottledCallback = (callback, wait) => {
  const timeoutId = useRef();
  const lastExecTime = useRef(0);
  const latestCallback = useLatest(callback);

  const throttledCallback = useCallback(
    (...args) => {
      let result;
      const elapsed = Date.now() - lastExecTime.current;
      const exec = () => {
        lastExecTime.current = Date.now();
        result = latestCallback.current(...args);
      };

      clearTimeout(timeoutId.current);

      if (elapsed > wait) {
        exec();
      } else {
        timeoutId.current = setTimeout(exec, wait - elapsed);
      }

      return result;
    },
    [latestCallback, wait]
  );

  const cancel = useCallback(() => {
    clearTimeout(timeoutId.current);
    timeoutId.current = undefined;
  }, []);

  useEffect(cancel, [cancel]);

  throttledCallback.cancel = cancel;

  return throttledCallback;
};

export default useThrottledCallback;
