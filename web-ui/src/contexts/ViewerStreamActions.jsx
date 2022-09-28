import { createContext, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import { BREAKPOINTS, STREAM_ACTION_NAME } from '../constants';
import { useResponsiveDevice } from './ResponsiveDevice';
import { useUser } from './User';
import useContextHook from './useContextHook';

const Context = createContext(null);
Context.displayName = 'ViewerStreamActions';

export const Provider = ({ children }) => {
  const { userData } = useUser();
  const { color } = userData || {};
  const { currentBreakpoint } = useResponsiveDevice();
  const [currentViewerAction, setCurrentViewerAction] = useState();
  const isChannelPageStackedView = currentBreakpoint < BREAKPOINTS.lg;
  const currentViewerStreamActionData = currentViewerAction?.data;
  const currentViewerStreamActionStartTime = currentViewerAction?.startTime;
  const currentViewerStreamActionName = currentViewerAction?.name;
  const currentViewerStreamActionTitle = `${currentViewerStreamActionName
    ?.charAt(0)
    ?.toUpperCase()}${currentViewerStreamActionName?.slice(1)}`;

  const [remainingTime, setRemainingTime] = useState(
    currentViewerStreamActionData?.duration
  );
  const shouldRenderActionInTab = useMemo(
    () =>
      [STREAM_ACTION_NAME.QUIZ, STREAM_ACTION_NAME.PRODUCT].includes(
        currentViewerStreamActionName
      ) && isChannelPageStackedView,
    [currentViewerStreamActionName, isChannelPageStackedView]
  );
  const augmentedCurrentViewerStreamActionData = useMemo(
    () => ({
      ...currentViewerStreamActionData,
      color,
      startTime: currentViewerStreamActionStartTime
    }),
    [color, currentViewerStreamActionData, currentViewerStreamActionStartTime]
  );

  const value = useMemo(
    () => ({
      currentViewerStreamActionData: augmentedCurrentViewerStreamActionData,
      currentViewerStreamActionName,
      currentViewerStreamActionTitle,
      shouldRenderActionInTab,
      setCurrentViewerAction,
      remainingTime,
      setRemainingTime
    }),
    [
      augmentedCurrentViewerStreamActionData,
      currentViewerStreamActionName,
      currentViewerStreamActionTitle,
      remainingTime,
      shouldRenderActionInTab
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useViewerStreamActions = () => useContextHook(Context);
