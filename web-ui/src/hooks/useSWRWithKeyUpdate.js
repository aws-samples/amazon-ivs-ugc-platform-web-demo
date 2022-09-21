import { useCallback, useState } from 'react';
import useSWR from 'swr';

const useSWRWithKeyUpdate = ({
  baseKey,
  fetcher,
  options,
  isEnabled = true
}) => {
  const [swrKey, setSwrKey] = useState(null);
  const swr = useSWR(isEnabled ? swrKey : null, fetcher, options);

  const updateKey = useCallback(
    (fetchKey) => {
      const key = [];
      if (baseKey) key.push(baseKey);
      if (fetchKey) key.push(fetchKey);

      if (key.length) setSwrKey(key);
    },
    [baseKey]
  );

  return { updateKey, swrKey, ...swr };
};

export default useSWRWithKeyUpdate;
