import { useCallback, useRef } from 'react';

import { throttle } from '../utils';

const useThrottledCallback = (callback, delay, dependencies = []) => {
  const callbackRef = useRef();
  callbackRef.current = callback;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(
    throttle((...args) => callbackRef.current(...args), delay),
    [delay, ...dependencies]
  );
};

export default useThrottledCallback;
