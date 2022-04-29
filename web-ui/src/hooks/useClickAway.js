import { useEffect, useRef } from 'react';

const defaultEvents = ['mouseup', 'touchend'];

const useClickAway = (ref, onClickAway, events = defaultEvents) => {
  const savedCallback = useRef(onClickAway);

  useEffect(() => {
    savedCallback.current = onClickAway;
  }, [onClickAway]);

  useEffect(() => {
    const handler = (event) => {
      const target = ref.current;
      target &&
        !target.contains(event.target) &&
        setTimeout(() => savedCallback.current(event), 50);
    };

    for (const eventName of events) {
      document.addEventListener(eventName, handler);
    }

    return () => {
      for (const eventName of events) {
        document.removeEventListener(eventName, handler);
      }
    };
  }, [events, ref]);
};

export default useClickAway;
