import { useEffect, useRef } from 'react';

const events = ['pointerdown'];

const useClickAway = (targetRefs, onClickAway, isEnabled = true) => {
  const savedCallback = useRef(onClickAway);
  const refs = useRef(targetRefs);

  useEffect(() => {
    savedCallback.current = onClickAway;
  }, [onClickAway]);

  useEffect(() => {
    if (!isEnabled) return;

    const handler = (event) => {
      refs.current.every(
        ({ current: target }) => target && !target.contains(event.target)
      ) && setTimeout(() => savedCallback.current(event), 50);
    };

    for (const eventName of events) {
      document.addEventListener(eventName, handler);
    }

    return () => {
      for (const eventName of events) {
        document.removeEventListener(eventName, handler);
      }
    };
  }, [isEnabled]);
};

export default useClickAway;
