import { useEffect } from 'react';

import useLatest from './useLatest';

const useResize = (
  callback,
  { shouldCallOnMount = false } = { shouldCallOnMount: false }
) => {
  const latestCallback = useLatest(callback);

  useEffect(() => {
    const handler = () => latestCallback.current();
    if (shouldCallOnMount) handler();

    window.addEventListener('resize', handler);
    window.addEventListener('orientationchange', handler); // legacy
    window.screen.orientation?.addEventListener('change', handler); // modern

    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('orientationchange', handler);
      window.screen.orientation?.removeEventListener('change', handler);
    };
  }, [latestCallback, shouldCallOnMount]);
};

export default useResize;
