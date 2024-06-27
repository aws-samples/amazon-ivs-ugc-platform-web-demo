import { useCallback, useMemo, useState } from 'react';

function useMap(
  initialStateMap = new Map()
) {
  const [map, setMap] = useState(new Map(initialStateMap));

  const set = useCallback((key, value) => {
    setMap((prevMap) => {
      const prevValue = prevMap.get(key);
      const nextValue = value instanceof Function ? value(prevValue) : value;

      if (prevValue === nextValue) {
        return prevMap;
      }

      const nextMap = new Map(prevMap);
      nextMap.set(key, nextValue);

      return nextMap;
    });
  }, []);

  const setAll = useCallback((mapOrEntries) => {
    setMap((prevMap) => {
      if (prevMap === mapOrEntries) {
        return prevMap;
      }

      return new Map(mapOrEntries);
    });
  }, []);

  const remove = useCallback((key) => {
    setMap((prevMap) => {
      const nextMap = new Map(prevMap);
      const isDeleted = nextMap.delete(key);

      return isDeleted ? nextMap : prevMap;
    });
  }, []);

  const clear = useCallback(() => {
    const newMap = new Map();

    setMap(newMap);

    return newMap;
  }, []);

  const mutators = useMemo(
    () => ({ set, setAll, remove, clear }),
    [set, setAll, remove, clear]
  );

  return [map, mutators];
}

export default useMap;
