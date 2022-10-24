import { useEffect } from 'react';

import useLatest from './useLatest';

const events = ['pointerdown'];

const useClickAway = (targetRefs, onClickAway, isEnabled = true) => {
  const latestCallback = useLatest(onClickAway);
  const latestRefs = useLatest(targetRefs);

  useEffect(() => {
    if (!isEnabled) return;

    const handler = (event) => {
      latestRefs.current.every(
        ({ current: target }) => target && !target.contains(event.target)
      ) && setTimeout(() => latestCallback.current(event), 50);
    };

    for (const eventName of events) {
      document.addEventListener(eventName, handler);
    }

    return () => {
      for (const eventName of events) {
        document.removeEventListener(eventName, handler);
      }
    };
  }, [isEnabled, latestRefs, latestCallback]);
};

export default useClickAway;
