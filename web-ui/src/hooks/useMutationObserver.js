import { useLayoutEffect, useRef } from 'react';

const createMutationObserver = (callback) => {
  const observer = new MutationObserver(callback);

  return {
    observer,
    subscribe(targetEl, opts) {
      observer.observe(targetEl, opts);
    },
    unsubscribe() {
      observer.disconnect();
    }
  };
};

/**
 * Fires a callback function when MutationObserver detects a change in the DOM
 * @param {array} targetRefs
 * @param {Function} callback
 * @param {boolean} isEnabled
 * @returns MutationObserver
 */
// https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
const useMutationObserver = (targetRefs, callback, isEnabled = true) => {
  const mutationObserverRef = useRef(createMutationObserver(callback));

  useLayoutEffect(() => {
    const targetEls =
      targetRefs?.reduce(
        (targetElsAcc, { current: el }) =>
          el ? [...targetElsAcc, el] : targetElsAcc,
        []
      ) || [];
    const mutationObserver = mutationObserverRef.current;

    if (!targetEls.length || !isEnabled) return;

    targetEls.forEach((targetEl) => {
      mutationObserver.subscribe(targetEl, {
        subtree: true,
        childList: true
      });
    });

    return () => {
      targetEls.forEach((targetEl) => {
        mutationObserver.unsubscribe(targetEl);
      });
    };
  }, [targetRefs, isEnabled]);
};

export default useMutationObserver;
