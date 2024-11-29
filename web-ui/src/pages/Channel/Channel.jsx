import { motion } from 'framer-motion';
import { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { channel as $channelContent } from '../../content';
import { clsm, extractChannelIdfromChannelArn } from '../../utils';
import {
  Provider as NotificationProvider,
  useNotif
} from '../../contexts/Notification';
import { Provider as ChatProvider } from '../../contexts/Chat';
import { Provider as PlayerProvider } from './contexts/Player';
import { sanitizeAmazonProductData } from '../../helpers/streamActionHelpers';
import { STREAM_ACTION_NAME } from '../../constants';
import { useChannel } from '../../contexts/Channel';
import { useChannelView } from './contexts/ChannelView';
import { useLayoutEffect } from 'react';
import { useProfileViewAnimation } from './contexts/ProfileViewAnimation';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice';
import { useViewerStreamActions } from '../../contexts/ViewerStreamActions';
import Chat from './Chat';
import PageUnavailable from '../../components/PageUnavailable';
import Player from './Player';
import ProductDescriptionModal from './ViewerStreamActions/Product/components/ProductDescriptionModal';
import ProductViewerStreamAction from './ViewerStreamActions/Product/components/Product';
import ProfileViewFloatingNav from './ProfileViewFloatingNav';
import QuizViewerStreamAction from './ViewerStreamActions/QuizCard';
import Tabs from '../../components/Tabs/Tabs';
import useMount from '../../hooks/useMount';
import useResize from '../../hooks/useResize';
import Poll from './Chat/Poll/Poll';
import { usePoll } from '../../contexts/StreamManagerActions/Poll';
import Notification from '../../components/Notification/Notification';
import { useAppSync } from '../../contexts/AppSync';
import channelEvents from '../../contexts/AppSync/channelEvents';
import { useUser } from '../../contexts/User';
import { apiBaseUrl } from '../../api/utils';
import { StageFactory, useStageManager } from '../../contexts/StageManager';
import { useRevalidator } from 'react-router-dom';
import usePrevious from '../../hooks/usePrevious';
import {
  updateError,
  updateNeutral,
  updateSuccess
} from '../../reducers/shared';

const DEFAULT_SELECTED_TAB_INDEX = 0;
const CHAT_PANEL_TAB_INDEX = 1;

const { leaveStages } = StageFactory;

const Channel = () => {
  const dispatch = useDispatch();
  const { collaborate, success, error, neutral } = useSelector(
    (state) => state.shared
  );
  const { channelError, channelData: { stageId, channelArn } = {} } =
    useChannel();
  const { isLandscape, isMobileView } = useResponsiveDevice();
  const { publish } = useAppSync();
  const { userData } = useUser();

  // Refs
  const channelRef = useRef();
  const chatSectionRef = useRef();

  // Revalidator
  const revalidator = useRevalidator();
  const prevUserStageId = usePrevious(stageId);

  // Real-time stage
  const { user: userStage = null } = useStageManager() || {};
  const { isConnected } = userStage || {};
  const shouldDisplayStagePlayer = isConnected;

  // Stream actions
  const {
    currentViewerStreamActionData,
    currentViewerStreamActionName,
    currentViewerStreamActionTitle,
    setCurrentViewerAction,
    shouldRenderActionInTab,
    isChannelPageStackedView
  } = useViewerStreamActions();
  const {
    isActive: isPollActive,
    pollTabLabel,
    hasVotes,
    shouldHideActivePoll
  } = usePoll();

  // Channel UI
  const isMounted = useMount();
  const { notifyError, notifySuccess, notifyNeutral } = useNotif();
  const { isStackedView, isSplitView } = useChannelView();
  const { getProfileViewAnimationProps, chatAnimationControls } =
    useProfileViewAnimation();
  const [selectedTabIndex, setSelectedTabIndex] = useState(
    DEFAULT_SELECTED_TAB_INDEX
  );
  const isTabView =
    shouldRenderActionInTab ||
    (isPollActive && isChannelPageStackedView && !shouldHideActivePoll);

  const visibleChatWidth = useMemo(() => {
    let width = 360;
    if (isSplitView) width = 308;
    else if (isStackedView) width = '100%';

    return width;
  }, [isSplitView, isStackedView]);

  /**
   * Chat section height
   */
  const updateChatSectionHeight = useCallback(() => {
    let chatSectionHeight = 200;

    if (isStackedView) {
      /**
       * When switching between mobile landscape and portrait modes, channelWidth may not be accurate.
       * Therefore, we use the window.innerHeight instead; otherwise, we use the channel width.
       */
      const { innerWidth, innerHeight } = window;
      const { clientWidth: channelWidth = 0 } = channelRef?.current || {};
      const width = isMobileView ? innerWidth : channelWidth;

      chatSectionHeight = Math.max(innerHeight - (width * 9) / 16, 200); // chat section should be no less than 200px in height
    }

    if (chatSectionRef.current)
      chatSectionRef.current.style.minHeight = `${chatSectionHeight}px`;
  }, [isMobileView, isStackedView]);

  useResize(updateChatSectionHeight, { shouldCallOnMount: true });
  // Ensures we have computed and set the chat section min-height before the first render
  useLayoutEffect(() => {
    if (!isMounted()) updateChatSectionHeight();
  }, [isMounted, updateChatSectionHeight]);

  /**
   * Success, error and neutral notifications
   */
  useEffect(() => {
    if (success) {
      notifySuccess(success);

      dispatch(updateSuccess(null));
    }

    if (error) {
      notifyError(error);

      dispatch(updateError(null));
    }

    if (neutral) {
      notifyNeutral(neutral, { asPortal: true });
      dispatch(updateNeutral(null));
    }
  }, [
    error,
    notifyError,
    success,
    notifySuccess,
    dispatch,
    neutral,
    notifyNeutral
  ]);

  /**
   * Revalidate (run channel page loader) when stageId updates
   * and does not equal to the previous stageId.
   * This should occur when the channel owner's stage session live status changes.
   */
  useEffect(() => {
    if (revalidator.state === 'idle' && prevUserStageId !== stageId) {
      leaveStages();
      revalidator.revalidate();
    }
  }, [prevUserStageId, revalidator, stageId]);

  // Triggered when navigating away from the channel page
  useEffect(() => {
    return () => {
      if (channelArn) {
        const channelId = extractChannelIdfromChannelArn(channelArn);

        publish(
          channelId,
          JSON.stringify({
            type: channelEvents.STAGE_REVOKE_REQUEST_TO_JOIN,
            channelId: userData?.channelId?.toLowerCase()
          })
        );
      }
    };
  }, [channelArn, publish, userData?.channelId]);

  // Triggered on page refresh or closed tab
  const beforeUnloadHandler = useCallback(() => {
    queueMicrotask(() => {
      setTimeout(() => {
        const channelId =
          channelArn && extractChannelIdfromChannelArn(channelArn);
        const body = {
          senderChannelId: userData?.channelId.toLowerCase(),
          receiverChannelId: channelId
        };

        // GraphQL API will throw a RequestAbortedException if attempting to do a AppSync publish here
        if (collaborate.isRequesting) {
          navigator.sendBeacon(
            `${apiBaseUrl}/stages/revokeStageRequest`,
            JSON.stringify(body)
          );
        }
      }, 0);
    });
  }, [channelArn, collaborate.isRequesting, userData?.channelId]);

  useEffect(() => {
    window.addEventListener('beforeunload', beforeUnloadHandler);

    return () => {
      window.removeEventListener('beforeunload', beforeUnloadHandler);
    };
  }, [beforeUnloadHandler]);

  if (channelError) return <PageUnavailable />;

  return (
    <PlayerProvider>
      <Notification />
      <div
        className={clsm([
          'flex',
          'items-center',
          'justify-center',
          /* Default View */
          'w-full',
          'h-screen',
          'flex-row',
          /* Stacked View */
          'lg:flex-col',
          'lg:h-full',
          'lg:min-h-screen',
          'overflow-hidden',
          /* Split View */
          isLandscape && [
            'md:flex-row',
            'md:h-screen',
            'touch-screen-device:lg:flex-row',
            'touch-screen-device:lg:h-screen'
          ]
        ])}
        ref={channelRef}
      >
        <Player
          chatSectionRef={chatSectionRef}
          stagePlayerVisible={shouldDisplayStagePlayer}
        />
        <ProductDescriptionModal />
        <motion.section
          {...getProfileViewAnimationProps(
            chatAnimationControls,
            {
              desktop: { collapsed: { width: 360 }, expanded: { width: 0 } },
              stacked: { width: '100%' },
              split: { collapsed: { width: 308 }, expanded: { width: 0 } }
            },
            {
              visible: { width: visibleChatWidth },
              hidden: { width: 0 }
            }
          )}
          className={clsm([
            'relative',
            'flex',
            'shrink-0',
            'overflow-hidden',
            /* Default View */
            'h-screen',
            /* Stacked View */
            'lg:h-full',
            /* Split View */
            isLandscape && [
              'md:h-screen',
              'md:min-h-[auto]',
              'touch-screen-device:lg:w-[308px]',
              'touch-screen-device:lg:h-screen',
              'touch-screen-device:lg:min-h-[auto]'
            ]
          ])}
        >
          <div
            ref={chatSectionRef}
            className={clsm([
              'relative',
              'flex',
              'bg-white',
              'dark:bg-darkMode-gray-dark',
              /* Default View */
              'min-w-[360px]',
              /* Stacked View */
              'lg:min-w-full',
              /* Split View */
              isLandscape && [
                'md:min-w-[308px]',
                'touch-screen-device:lg:min-w-[308px]'
              ]
            ])}
          >
            <Tabs>
              {isTabView && (
                <>
                  <Tabs.List
                    selectedIndex={selectedTabIndex}
                    setSelectedIndex={setSelectedTabIndex}
                    tabs={[
                      {
                        label: isPollActive
                          ? pollTabLabel
                          : currentViewerStreamActionTitle,
                        panelIndex: 0
                      },
                      { label: $channelContent.tabs.chat, panelIndex: 1 }
                    ]}
                  />
                  <Tabs.Panel index={0} selectedIndex={selectedTabIndex}>
                    {hasVotes && (
                      <NotificationProvider>
                        <ChatProvider>
                          {!shouldHideActivePoll && (
                            <Poll shouldRenderInTab={true} />
                          )}
                        </ChatProvider>
                      </NotificationProvider>
                    )}
                    {!isPollActive &&
                      currentViewerStreamActionName ===
                        STREAM_ACTION_NAME.QUIZ && (
                        <QuizViewerStreamAction
                          {...currentViewerStreamActionData}
                          setCurrentViewerAction={setCurrentViewerAction}
                          shouldRenderActionInTab={shouldRenderActionInTab}
                        />
                      )}
                    {!isPollActive &&
                      [
                        STREAM_ACTION_NAME.AMAZON_PRODUCT,
                        STREAM_ACTION_NAME.PRODUCT
                      ].includes(currentViewerStreamActionName) && (
                        <div
                          className={clsm([
                            'absolute',
                            'h-full',
                            'no-scrollbar',
                            'overflow-x-hidden',
                            'overflow-y-auto',
                            'pb-5',
                            'px-5',
                            'supports-overlay:overflow-y-overlay',
                            'w-full'
                          ])}
                        >
                          <ProductViewerStreamAction
                            {...(currentViewerStreamActionName ===
                            STREAM_ACTION_NAME.AMAZON_PRODUCT
                              ? sanitizeAmazonProductData(
                                  currentViewerStreamActionData
                                )
                              : currentViewerStreamActionData)}
                          />
                        </div>
                      )}
                  </Tabs.Panel>
                </>
              )}
              {selectedTabIndex === 0 && isTabView && (
                <ProfileViewFloatingNav
                  containerClassName="fixed"
                  reverseVisibility
                />
              )}
              <Tabs.Panel
                index={1}
                selectedIndex={
                  isTabView ? selectedTabIndex : CHAT_PANEL_TAB_INDEX
                }
              >
                <NotificationProvider>
                  <ChatProvider>
                    {!isTabView && hasVotes && !shouldHideActivePoll && (
                      <Poll />
                    )}
                    <Chat
                      shouldRunCelebration={
                        currentViewerStreamActionName ===
                        STREAM_ACTION_NAME.CELEBRATION
                      }
                    />
                  </ChatProvider>
                </NotificationProvider>
              </Tabs.Panel>
            </Tabs>
          </div>
        </motion.section>
      </div>
    </PlayerProvider>
  );
};

export default Channel;
