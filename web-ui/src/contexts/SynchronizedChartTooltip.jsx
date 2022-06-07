import { createContext, useCallback, useMemo, useRef, useState } from 'react';
import { localPoint } from '@visx/event';
import PropTypes from 'prop-types';

import useThrottledCallback from '../hooks/useThrottledCallback';
import useContextHook from './useContextHook';

const Context = createContext(null);
Context.displayName = 'SynchronizedChartTooltip';

export const Provider = ({ children }) => {
  const [xValue, setXValue] = useState(null);
  const isTooltipOpen = useMemo(() => xValue !== undefined, [xValue]);
  const mouseXCoord = useRef();
  const isMouseOver = useRef(false);

  const showSynchronizedTooltips = useCallback(() => {
    isMouseOver.current = true;
  }, []);

  const hideSynchronizedTooltips = useCallback(() => {
    isMouseOver.current = false;
    setXValue(undefined);
  }, []);

  const handleSynchronizedTooltips = useThrottledCallback((event) => {
    if (!isMouseOver.current) return;

    const { x } = localPoint(event) || { x: mouseXCoord?.current || 0 };

    setXValue(x);
    mouseXCoord.current = x;
  }, 100);

  const value = useMemo(
    () => ({
      isTooltipOpen,
      showSynchronizedTooltips,
      hideSynchronizedTooltips,
      handleSynchronizedTooltips,
      xValue
    }),
    [
      isTooltipOpen,
      showSynchronizedTooltips,
      hideSynchronizedTooltips,
      handleSynchronizedTooltips,
      xValue
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useSynchronizedChartTooltip = () => useContextHook(Context);
