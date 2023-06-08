/* eslint-disable react-hooks/exhaustive-deps */
import { useMemo, useState, useRef } from 'react';

import useLatest from './useLatest';

/**
 * @param {map} initialMap
 * @param {boolean} isUnstableState - set to true to handle a possible situation where the map may be updated before a delete operation, causing inconsistencies. By using the latestStableMapRef reference, we ensure that the delete operation is performed on the most up-to-date version of the map.
 */

const useMap = (initialMap = {}, isUnstableState = false) => {
  const [map, set] = useState(initialMap);
  const latestMap = useLatest(map);
  const latestInitialMap = useLatest(initialMap);
  const latestStableMapRef = useRef({});

  const stableActions = useMemo(
    () => ({
      get: (key) => latestMap.current[key],
      has: (key) => key in latestMap.current,
      set: (key, value) =>
        set((prev) => {
          if (isUnstableState)
            latestStableMapRef.current = { ...prev, [key]: value };
          return { ...prev, [key]: value };
        }),
      delete: (key) =>
        set((prev) => {
          /**
           * Using latestStableMapRef instead of prevState ensures
           * rest equates to the latest rest value
           */
          let previousState = prev;
          if (isUnstableState) previousState = latestStableMapRef.current;
          const { [key]: _omit, ...rest } = previousState;

          return rest;
        }),
      reset: () => {
        if (isUnstableState)
          latestStableMapRef.current = latestInitialMap.current;
        set(latestInitialMap.current);
      },
      clear: () => {
        if (isUnstableState) latestStableMapRef.current = {};
        set({});
      },
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
