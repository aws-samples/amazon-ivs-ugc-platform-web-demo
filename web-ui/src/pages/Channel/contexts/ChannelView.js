import { createContext, useMemo } from 'react';
import PropTypes from 'prop-types';

import { BREAKPOINTS } from '../../../constants';
import { useResponsiveDevice } from '../../../contexts/ResponsiveDevice';
import useContextHook from '../../../contexts/useContextHook';

const Context = createContext(null);
Context.displayName = 'ChannelView';

export const Provider = ({ children }) => {
  const { currentBreakpoint, isLandscape, isMobileView } =
    useResponsiveDevice();

  const value = useMemo(() => {
    const isSplitView = isMobileView && isLandscape;
    const isStackedView = !isSplitView && currentBreakpoint < BREAKPOINTS.lg;
    const isDesktopView = !isSplitView && !isStackedView;

    let currentView = 'desktop';
    if (isStackedView) currentView = 'stacked';
    if (isSplitView) currentView = 'split';

    return { currentView, isDesktopView, isStackedView, isSplitView };
  }, [currentBreakpoint, isLandscape, isMobileView]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useChannelView = () => useContextHook(Context);
