import { createContext, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import { BREAKPOINTS, STREAM_ACTION_NAME } from '../constants';
import { useResponsiveDevice } from './ResponsiveDevice';
import useContextHook from './useContextHook';
import viewerStreamActionsMock from '../mocks/viewerStreamActions.json'; // Temp

const Context = createContext(null);
Context.displayName = 'ViewerStreamActions';

export const Provider = ({ children }) => {
  const [currentViewerAction] = useState(viewerStreamActionsMock[0]); // Temporary, default should be empty
  const { isMobileView, currentBreakpoint } = useResponsiveDevice();
  const isChannelPageStackedView = currentBreakpoint < BREAKPOINTS.lg;
  const currentViewerStreamActionData = currentViewerAction?.data;
  const currentViewerStreamActionName = currentViewerAction?.name;
  const currentViewerStreamActionTitle = `${currentViewerStreamActionName
    ?.charAt(0)
    ?.toUpperCase()}${currentViewerStreamActionName?.slice(1)}`;
  const shouldRenderActionInTab = useMemo(
    () =>
      [STREAM_ACTION_NAME.QUIZ, STREAM_ACTION_NAME.PRODUCT].includes(
        currentViewerStreamActionName
      ) &&
      (isChannelPageStackedView || isMobileView),
    [currentViewerStreamActionName, isChannelPageStackedView, isMobileView]
  );

  const value = useMemo(
    () => ({
      currentViewerStreamActionData,
      currentViewerStreamActionName,
      currentViewerStreamActionTitle,
      shouldRenderActionInTab
    }),
    [
      currentViewerStreamActionData,
      currentViewerStreamActionName,
      currentViewerStreamActionTitle,
      shouldRenderActionInTab
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useViewerStreamActions = () => useContextHook(Context);
