import { useCallback, useEffect } from 'react';

import { noop } from '../utils';
import { useLastFocusedElement } from '../contexts/LastFocusedElement';

/**
 * Before you use the `refocus` function exposed by this hook, you should set the last focused element using setLastFocusedElement.
 * Relying on `document.activeElement` isn't an option as it is not fully supported on Safari.
 */
const usePreviousFocus = ({ isActive, onRefocus = noop }) => {
  const { getLastFocusedElement, setLastFocusedElement } =
    useLastFocusedElement();

  const refocus = useCallback(
    (event, forceRefocus = false) => {
      if (event && event.key !== 'Escape' && !forceRefocus) return;

      setTimeout(() => {
        getLastFocusedElement()?.focus();
        setLastFocusedElement(null);
      });
      onRefocus(event instanceof KeyboardEvent);
    },
    [getLastFocusedElement, onRefocus, setLastFocusedElement]
  );

  useEffect(() => {
    if (isActive) {
      document.addEventListener('keydown', refocus);
      getLastFocusedElement()?.blur();

      return () => document.removeEventListener('keydown', refocus);
    }
  }, [getLastFocusedElement, isActive, refocus]);

  return { refocus };
};

export default usePreviousFocus;
