import { useEffect, useRef } from 'react';

const defaultEvents = ['pointerdown'];

const useClickAway = (targetRefs, onClickAway, events = defaultEvents) => {
  const savedCallback = useRef(onClickAway);
  const refs = useRef(targetRefs);

  useEffect(() => {
    savedCallback.current = onClickAway;
  }, [onClickAway]);

  useEffect(() => {
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
  }, [events]);
};

export default useClickAway;
