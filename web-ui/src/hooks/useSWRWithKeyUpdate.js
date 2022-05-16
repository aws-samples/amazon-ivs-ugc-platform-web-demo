import { useCallback, useState } from 'react';
import useSWR from 'swr';

const useSWRWithKeyUpdate = (baseKey, fetcher, options) => {
  const [swrKey, setSwrKey] = useState(null);
  const swr = useSWR(swrKey, fetcher, options);

  const updateKey = useCallback(
    (fetchKey) => {
      const key = [];
      if (baseKey) key.push(baseKey);
      if (fetchKey) key.push(fetchKey);

      if (key.length) setSwrKey(key);
    },
    [baseKey]
  );

  return { updateKey, ...swr };
};

export default useSWRWithKeyUpdate;
