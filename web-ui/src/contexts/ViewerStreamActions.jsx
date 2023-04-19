import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';

import { BREAKPOINTS, STREAM_ACTION_NAME } from '../constants';
import { useChannel } from './Channel';
import { useResponsiveDevice } from './ResponsiveDevice';
import useContextHook from './useContextHook';
import useCountdown from '../hooks/useCountdown';

const TIME_BASED_VIEWER_ACTIONS = [
  STREAM_ACTION_NAME.CELEBRATION,
  STREAM_ACTION_NAME.NOTICE,
  STREAM_ACTION_NAME.QUIZ
];

const Context = createContext(null);
Context.displayName = 'ViewerStreamActions';

export const Provider = () => {
  const { channelData } = useChannel();
  const { color, isLive } = channelData || {};
  const { currentBreakpoint } = useResponsiveDevice();
  const [currentViewerAction, setCurrentViewerAction] = useState();
  const outletCtx = useOutletContext();
  const isChannelPageStackedView = currentBreakpoint < BREAKPOINTS.lg;
  const currentViewerStreamActionData = currentViewerAction?.data;
  const currentViewerStreamActionStartTime = currentViewerAction?.startTime;
  const currentViewerStreamActionName = currentViewerAction?.name;
  const currentViewerStreamActionTitle = `${currentViewerStreamActionName
    ?.charAt(0)
    ?.toUpperCase()}${currentViewerStreamActionName?.slice(1)}`;
  const augmentedCurrentViewerStreamActionData = useMemo(
    () => ({
      ...currentViewerStreamActionData,
      color,
      startTime: currentViewerStreamActionStartTime
    }),
    [color, currentViewerStreamActionData, currentViewerStreamActionStartTime]
  );
  const { duration: viewerActionDuration, startTime: viewerActionStartTime } =
    augmentedCurrentViewerStreamActionData;
  const viewerActionExpiry =
    typeof viewerActionDuration === 'number' &&
    typeof viewerActionStartTime === 'number'
      ? viewerActionStartTime + viewerActionDuration * 1000
      : null;

  const clearCurrentViewerAction = useCallback(
    () => setCurrentViewerAction(null),
    []
  );
  const clearCurrentViewerActionWithDelay = useCallback(() => {
    setTimeout(
      () =>
        setCurrentViewerAction((prev) => {
          if (prev?.name === STREAM_ACTION_NAME.QUIZ) return null;

          // Don't cancel the current action if it changed to something other than a quiz
          return prev;
        }),
      2000
    );
  }, [setCurrentViewerAction]);

  useCountdown({
    expiry: viewerActionExpiry,
    isEnabled:
      TIME_BASED_VIEWER_ACTIONS.includes(currentViewerStreamActionName) &&
      viewerActionExpiry,
    onExpiry:
      currentViewerStreamActionName === STREAM_ACTION_NAME.QUIZ
        ? clearCurrentViewerActionWithDelay
        : clearCurrentViewerAction
  });

  useEffect(() => {
    if (!isLive) clearCurrentViewerAction();
  }, [clearCurrentViewerAction, isLive]);

  const shouldRenderActionInTab = useMemo(
    () =>
      [STREAM_ACTION_NAME.QUIZ, STREAM_ACTION_NAME.PRODUCT].includes(
        currentViewerStreamActionName
      ) && isChannelPageStackedView,
    [currentViewerStreamActionName, isChannelPageStackedView]
  );

  const value = useMemo(
    () => ({
      clearCurrentViewerAction,
      currentViewerStreamActionData: augmentedCurrentViewerStreamActionData,
      currentViewerStreamActionName,
      currentViewerStreamActionTitle,
      setCurrentViewerAction,
      shouldRenderActionInTab
    }),
    [
      augmentedCurrentViewerStreamActionData,
      clearCurrentViewerAction,
      currentViewerStreamActionName,
      currentViewerStreamActionTitle,
      shouldRenderActionInTab
    ]
  );

  return (
    <Context.Provider value={value}>
      <Outlet context={outletCtx} />
    </Context.Provider>
  );
};

export const useViewerStreamActions = () => useContextHook(Context);
