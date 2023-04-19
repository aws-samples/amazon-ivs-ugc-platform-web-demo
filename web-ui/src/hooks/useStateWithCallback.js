import { useState, useRef, useEffect, useCallback } from 'react';

import usePrevious from './usePrevious';

const useStateWithCallback = (initialValue) => {
  const [value, setValue] = useState(initialValue);
  const prevValue = usePrevious(value);
  const callbacksRef = useRef(new Set());

  useEffect(() => {
    for (const callback of callbacksRef.current) {
      callback(prevValue, value);
    }

    callbacksRef.current.clear();
  }, [value, prevValue]);

  const setValueWithCallback = useCallback((setter, callback) => {
    setValue((prevValue) => {
      const nextValue =
        typeof setter === 'function' ? setter(prevValue) : setter;

      if (nextValue === prevValue) return prevValue;

      callback && callbacksRef.current.add(callback);

      return nextValue;
    });
  }, []);

  return [value, setValueWithCallback];
};

export default useStateWithCallback;
