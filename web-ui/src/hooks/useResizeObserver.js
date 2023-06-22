import { useLayoutEffect } from 'react';

import { useResponsiveDevice } from '../contexts/ResponsiveDevice';
import useLatest from './useLatest';

let globalResizeObserver;
const getResizeObserver = () =>
  !globalResizeObserver
    ? (globalResizeObserver = createResizeObserver())
    : globalResizeObserver;

/**
 * Fires a callback function when ResizeObserver detects a change in the dimensions of an element's content or border box
 * @param {object} targetRef
 * @param {Function} callback
 * @param {boolean} isEnabled
 * @returns ResizeObserver
 */
// https://github.com/jaredLunde/react-hook/tree/master/packages/resize-observer
const useResizeObserver = (targetRef, callback, isEnabled = true) => {
  const { isMobileView } = useResponsiveDevice();
  const resizeObserver = getResizeObserver();
  const storedCallback = useLatest(callback);

  useLayoutEffect(() => {
    const targetEl = targetRef?.current;
    if (!targetEl || !isEnabled) return;

    let didUnsubscribe = false;
    const cb = (entry, observer) => {
      if (didUnsubscribe) return; // prevents race conditions
      storedCallback.current(entry, observer);
    };
    resizeObserver.subscribe(targetEl, cb);

    return () => {
      didUnsubscribe = true;
      resizeObserver.unsubscribe(targetEl, cb);
    };
  }, [targetRef, resizeObserver, storedCallback, isEnabled, isMobileView]);

  return resizeObserver.observer;
};

const createResizeObserver = () => {
  let ticking = false;
  let allEntries = [];
  const callbacks = new Map();

  const observer = new ResizeObserver((entries, obs) => {
    allEntries = allEntries.concat(entries);

    if (!ticking) {
      requestAnimationFrame(() => {
        const triggered = new Set();

        for (let i = 0; i < allEntries.length; i++) {
          const entry = allEntries[i];
          const { target } = entry;

          if (triggered.has(target)) continue;
          triggered.add(target);

          const cbs = callbacks.get(target);
          cbs?.forEach((cb) => cb(entry, obs));
        }

        allEntries = [];
        ticking = false;
      });
    }

    ticking = true;
  });

  return {
    observer,
    subscribe(targetEl, callback) {
      observer.observe(targetEl);
      const cbs = callbacks.get(targetEl) || [];
      cbs.push(callback);
      callbacks.set(targetEl, cbs);
    },
    unsubscribe(targetEl, callback) {
      const cbs = callbacks.get(targetEl) || [];
      if (cbs.length === 1) {
        observer.unobserve(targetEl);
        callbacks.delete(targetEl);
        return;
      }

      const cbIndex = cbs.indexOf(callback);
      if (cbIndex !== -1) cbs.splice(cbIndex, 1);
      callbacks.set(targetEl, cbs);
    }
  };
};

export default useResizeObserver;
