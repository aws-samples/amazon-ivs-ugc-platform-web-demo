import { useEffect } from 'react';

const useResize = (
  callback,
  { shouldCallOnMount = false } = { shouldCallOnMount: false }
) => {
  useEffect(() => {
    if (shouldCallOnMount) callback();

    window.addEventListener('resize', callback);
    window.addEventListener('orientationchange', callback); // legacy
    window.screen.orientation?.addEventListener('change', callback); // modern

    return () => {
      window.removeEventListener('resize', callback);
      window.removeEventListener('orientationchange', callback);
      window.screen.orientation?.removeEventListener('change', callback);
    };
  }, [callback, shouldCallOnMount]);
};

export default useResize;
