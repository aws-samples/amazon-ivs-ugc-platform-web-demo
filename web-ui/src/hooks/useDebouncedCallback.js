import { useCallback, useRef } from 'react';

import { debounce } from '../utils';

const useDebouncedCallback = (callback, delay, dependencies = []) => {
  const callbackRef = useRef();
  callbackRef.current = callback;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(
    debounce((...args) => callbackRef.current(...args), delay),
    [delay, ...dependencies]
  );
};

export default useDebouncedCallback;
