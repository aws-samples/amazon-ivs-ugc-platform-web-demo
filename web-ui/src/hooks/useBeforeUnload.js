import { useEffect } from 'react';

/**
 * This hook assumes prior user interaction with the page.
 * In the absence of user interaction, the confirmation dialog is not shown.
 */
const useBeforeUnload = (isEnabled = true) => {
  useEffect(() => {
    if (!isEnabled) return;

    const handler = (event) => {
      event.preventDefault();

      /**
       * Chrome does not support `event.preventDefault()` on beforeunload events; instead, we must set the return value.
       * https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event#browser_compatibility
       */
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handler, { capture: true });

    return () =>
      window.removeEventListener('beforeunload', handler, { capture: true });
  }, [isEnabled]);
};

export default useBeforeUnload;
