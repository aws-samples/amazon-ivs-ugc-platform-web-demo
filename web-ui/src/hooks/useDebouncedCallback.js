import { useCallback, useEffect, useRef } from 'react';

import useLatest from './useLatest';

/**
 * Creates a debounced function that delays invoking callback until after wait milliseconds have
 * elapsed since the last time the debounced function was invoked. The debounced function comes
 * with a cancel method to cancel delayed callback invocations. If the debounced function is
 * specified to be immediate, then the the callback function is invoked at the leading edge of
 * the wait timeout; otherwise, it is invoked at the trailing edge.
 * @param {func} callback function to debounce
 * @param {number} wait number of milliseconds to delay
 * @param {boolean} immediate true if callback is to be invoked at the leading edge
 *                            of the wait period, false if at the trailing edge
 */
const useDebouncedCallback = (
  callback,
  wait,
  { immediate = false } = { immediate: false }
) => {
  const timeoutId = useRef();
  const latestCallback = useLatest(callback);

  const debouncedCallback = useCallback(
    (...args) => {
      let result;
      if (immediate && !timeoutId.current)
        result = latestCallback.current(...args);

      clearTimeout(timeoutId.current);

      timeoutId.current = setTimeout(
        immediate
          ? () => {
              clearTimeout(timeoutId.current);
              timeoutId.current = undefined;
            }
          : () => latestCallback.current(...args),
        wait
      );

      return result;
    },
    [immediate, latestCallback, wait]
  );

  const cancel = useCallback(() => {
    clearTimeout(timeoutId.current);
    timeoutId.current = undefined;
  }, []);

  useEffect(cancel, [cancel]);

  debouncedCallback.cancel = cancel;

  return debouncedCallback;
};

export default useDebouncedCallback;
