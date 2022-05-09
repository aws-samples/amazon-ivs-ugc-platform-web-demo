import { useCallback, useRef } from 'react';

/**
 * Executes a callback function predictably, after a certain delay.
 * Throttling a function prevents excessive or repeated calling of
 * the function, but does not get reset in the process (i.e. acts
 * as a rate limiter for execution of handlers)
 * @param {number} delay
 * @param {func} callback
 */
export const throttle = (callback, delay) => {
  let timeoutID;
  let cancelled = false;
  let lastExec = 0;

  const wrapper = (...args) => {
    const elapsed = Date.now() - lastExec;
    const exec = () => {
      lastExec = Date.now();
      callback(...args);
    };

    if (cancelled) return;

    clearTimeout(timeoutID);

    if (elapsed > delay) {
      exec();
    } else {
      timeoutID = setTimeout(exec, delay - elapsed);
    }
  };

  wrapper.cancel = () => {
    clearTimeout(timeoutID);
    cancelled = true;
  };

  return wrapper;
};

const useThrottledCallback = (callback, delay) => {
  const callbackRef = useRef();
  callbackRef.current = callback;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(
    throttle((...args) => callbackRef.current(...args), delay),
    [delay]
  );
};

export default useThrottledCallback;
