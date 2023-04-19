import { useMemo, useState } from 'react';

import useLatest from './useLatest';

const useMap = (initialMap = {}) => {
  const [map, set] = useState(initialMap);
  const latestMap = useLatest(map);
  const latestInitialMap = useLatest(initialMap);

  const stableActions = useMemo(
    () => ({
      get: (key) => latestMap.current[key],
      has: (key) => key in latestMap.current,
      set: (key, value) => set((prev) => ({ ...prev, [key]: value })),
      delete: (key) => set(({ [key]: _omit, ...rest }) => rest),
      reset: () => set(latestInitialMap.current),
      clear: () => set({}),
      keys: () => Object.keys(latestMap.current),
      values: () => Object.values(latestMap.current),
      entries: () => Object.entries(latestMap.current)
    }),
    [latestMap, latestInitialMap]
  );

  stableActions._map = map;

  return stableActions;
};

export default useMap;
