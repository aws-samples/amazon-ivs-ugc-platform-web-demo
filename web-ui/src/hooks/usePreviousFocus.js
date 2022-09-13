import { useCallback, useEffect } from 'react';

import { useLastFocusedElement } from '../contexts/LastFocusedElement';

/**
 * Before you use the `refocus` function exposed by this hook, you should set the last focused element using setLastFocusedElement.
 * Relying on `document.activeElement` isn't an option as it is not fully supported on Safari.
 */
const usePreviousFocus = ({ isActive, onRefocus }) => {
  const { getLastFocusedElement, setLastFocusedElement } =
    useLastFocusedElement();

  const refocus = useCallback(
    (event) => {
      if (event && event instanceof KeyboardEvent && event.key !== 'Escape')
        return;

      setTimeout(() => {
        getLastFocusedElement()?.focus();
        setLastFocusedElement(null);
      });
      onRefocus();
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
