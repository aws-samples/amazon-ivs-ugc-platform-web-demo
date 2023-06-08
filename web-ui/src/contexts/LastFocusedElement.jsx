import { createContext, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';

import useContextHook from './useContextHook';

const Context = createContext(null);
Context.displayName = 'LastFocusedElement';

export const Provider = ({ children }) => {
  // This context stores a ref that should be used to store the last focused element that should be refocused when calling `refocus` from `usePreviousFocus`
  const lastFocusedElement = useRef();
  const getLastFocusedElement = useCallback(
    () => lastFocusedElement.current,
    []
  );
  const setLastFocusedElement = useCallback(
    (elem) => (lastFocusedElement.current = elem),
    []
  );

  const value = useMemo(
    () => ({ getLastFocusedElement, setLastFocusedElement }),
    [getLastFocusedElement, setLastFocusedElement]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useLastFocusedElement = () => useContextHook(Context);
