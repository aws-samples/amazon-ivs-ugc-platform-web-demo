import { useCallback, useEffect, useRef } from 'react';
import { debounce } from 'lodash';

function useDebouncedEventQueue(activeUser, maxQueueSize, sendDrawEvents) {
  const queue = useRef([]);
  const flushEvents = useCallback(() => {
    if (queue.current.length > 0) {
      const payload = {
        action: 'DRAW_EVENTS',
        user: activeUser,
        events: [...queue.current]
      };
     
      sendDrawEvents(convertEventsToString(payload))
  
      queue.current = [];
    }
  }, [activeUser, sendDrawEvents]);

  const debouncedFlushEvents = useRef(debounce(flushEvents, 100));
  useEffect(() => {
    debouncedFlushEvents.current = debounce(flushEvents, 100);
    return () => {
      debouncedFlushEvents.current.cancel();
    };
  }, [flushEvents]);

  const queueEvent = useCallback(
    (event) => {
      queue.current = [...queue.current, event];
      if (queue.current.length >= maxQueueSize || event.type === 'mouseup') {
        debouncedFlushEvents.current.cancel();
        flushEvents();
      } else {
        debouncedFlushEvents.current();
      }
    },
    [flushEvents, maxQueueSize]
  );

  return queueEvent;
}

export default useDebouncedEventQueue;

export const convertEventsToString = (jsonData) => {
  const eventMapping = {
    mousedown: 0,
    mousemove: 1,
    mouseup: 2
  };
  const result = [];

  const mousedownEvent = jsonData?.events?.find((e) => e.type === 'mousedown');
  let color = mousedownEvent?.color||'#000000'
  
  result.push(`${jsonData.user},${color}`);

  jsonData.events.forEach((event) => {
    const eventType = event.type;
    const eventCode = eventMapping[eventType];

    if (eventCode !== undefined) {
      let shouldPush =
        !!event.x && !!event.y
      if (shouldPush) {
        result.push(
          `${eventCode},${event.x},${event.y}`
        );
      } else {
        result.push(`${eventCode}`);
      }
    }
  });

  const resultStr = result.join('|');
  return resultStr;
};

export function convertStringToJSON(inputStr) {
  const parts = inputStr.split('|');
  const userData = parts[0].split(',');
  const user = userData[0];
  const color = userData[1];

  const eventMapping = {
    0: 'mousedown',
    1: 'mousemove',
    2: 'mouseup'
  };

  const events = [];

  for (let i = 1; i < parts.length; i++) {
    const eventParts = parts[i].split(',');
    const eventType = eventMapping[eventParts[0]];
    const x = +eventParts[1];
    const y = +eventParts[2];
    events.push({
      type: eventType,
      user: user,
      ...(!isNaN(x) && { x }),
      ...(!isNaN(y) && { y }),
      ...(eventType === eventMapping[0] && { color }),
    });
  }

  const jsonData = {
    action: 'DRAW_EVENTS',
    user: user,
    events: events
  };
  return jsonData;
}
