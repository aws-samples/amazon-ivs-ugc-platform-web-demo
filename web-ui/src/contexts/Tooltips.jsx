import PropTypes from 'prop-types';
import {
  createContext,
  useMemo,
  useState,
  useCallback,
  useEffect
} from 'react';

import useContextHook from './useContextHook';

const Context = createContext(null);
Context.displayName = 'Tooltips';

export const Provider = ({ children }) => {
  const [tooltips, setTooltips] = useState([]);

  const addTooltip = useCallback(
    (tooltip) => setTooltips((prevTooltips) => [...prevTooltips, tooltip]),
    []
  );

  const removeTooltip = useCallback(
    (tooltipId) =>
      setTooltips((prevTooltips) =>
        prevTooltips.filter((t) => t.id !== tooltipId)
      ),
    []
  );

  useEffect(() => {
    // Only 1 tooltip should be open at any time. This ensures that we only keep the latest tooltip
    // open in the rare case that multiple tooltips happen to be open (i.e. on some touch devices)
    if (tooltips.length > 1) {
      for (let i = 0; i < tooltips.length - 1; i++) {
        tooltips[i].hideTooltip();
      }
    }
  }, [tooltips]);

  const value = useMemo(
    () => ({ addTooltip, removeTooltip }),
    [addTooltip, removeTooltip]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useTooltips = () => useContextHook(Context);
