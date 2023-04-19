import { useCallback, useEffect, useState } from 'react';

import useLatest from './useLatest';

const useMount = () => {
  const [isMounted, setIsMounted] = useState(false);
  const latestIsMounted = useLatest(isMounted);

  const getMountedState = useCallback(
    () => latestIsMounted.current,
    [latestIsMounted]
  );

  useEffect(() => setIsMounted(true), []);

  return getMountedState;
};

export default useMount;
