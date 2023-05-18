import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * This hook controls the loader's display duration, preventing
 * flickering when it is removed too quickly on mount.
 * You can set a minimum display time for the loader.
 * @param {number} timeout time to wait before removing the loader
 * @returns {boolean} indicates whether the loader should be visible or not
 */
const useForceLoader = (timeout = 500) => {
  const [isLoadingForced, setIsLoadingForced] = useState(true);
  const forceSpinnerTimeoutId = useRef();

  const forceSpinner = useCallback(() => {
    setIsLoadingForced(true);

    if (forceSpinnerTimeoutId.current) {
      clearTimeout(forceSpinnerTimeoutId.current);
    }

    forceSpinnerTimeoutId.current = setTimeout(
      () => setIsLoadingForced(false),
      timeout
    );
  }, [timeout]);

  useEffect(() => forceSpinner(), [forceSpinner]);

  return isLoadingForced;
};

export default useForceLoader;
