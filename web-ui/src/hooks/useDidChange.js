import usePrevious from './usePrevious';

const useDidChange = (value) => {
  const prevValue = usePrevious(value);

  return prevValue !== undefined && prevValue !== value;
};

export default useDidChange;
