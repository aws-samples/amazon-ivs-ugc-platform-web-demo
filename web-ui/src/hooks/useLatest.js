import { useRef } from 'react';

const useLatest = (current) => {
  const value = useRef(current);

  value.current = current;

  return value;
};

export default useLatest;
