import { useState, useRef, useEffect, useCallback } from 'react';
import usePrevious from './usePrevious';

const useStateWithCallback = (initialValue) => {
  const callbackRef = useRef(null);
  const [value, setValue] = useState(initialValue);
  const prevValue = usePrevious(value);

  useEffect(() => {
    if (callbackRef.current) {
      callbackRef.current(prevValue);

      callbackRef.current = null;
    }
  }, [value, prevValue]);

  const setValueWithCallback = useCallback((newValue, callback) => {
    callbackRef.current = callback;

    return setValue(newValue);
  }, []);

  return [value, setValueWithCallback];
};

export default useStateWithCallback;
