import { motion } from 'framer-motion';
import { useCallback, useState, useRef, useEffect } from 'react';

import { channel as $channelContent } from '../../content';
import {
  clsm,
  extractChannelIdfromChannelArn,
  retryWithExponentialBackoff
} from '../../utils';
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
import { getSpectatorToken } from '../../api/stages';
import useStageClient from '../../hooks/useStageClient';
import { Provider as BroadcastFullscreenProvider } from '../../contexts/BroadcastFullscreen';
import { useGlobalStage } from '../../contexts/Stage';
import { player as $playerContent } from '../../content';
import usePrevious from '../../hooks/usePrevious';
import Notification from '../../components/Notification/Notification';
import { useAppSync } from '../../contexts/AppSync';
import channelEvents from '../../contexts/AppSync/channelEvents';
import { useUser } from '../../contexts/User';
import { apiBaseUrl } from '../../api/utils';

const DEFAULT_SELECTED_TAB_INDEX = 0;
const CHAT_PANEL_TAB_INDEX = 1;

const Channel = () => {
  const shouldFetchSpectatorTokenRef = useRef(true);
  const { channelError, channelData: { stageId, channelArn } = {} } =
    useChannel();
  const {
    strategy,
    resetParticipants,
    updateError,
    error: stageError,
    success: stageSuccessMessage,
    updateSuccess,
    requestingToJoinStage,
    updateRequestingToJoinStage
  } = useGlobalStage();
  const { notifyError, notifySuccess } = useNotif();
  const { publish } = useAppSync();
  const { userData } = useUser();

  useEffect(() => {
    if (stageSuccessMessage) {
      if (
        stageSuccessMessage ===
        $channelContent.notifications.success.request_to_join_stage_success
      ) {
        notifySuccess(stageSuccessMessage);
      }

      updateSuccess(null);
    }

    if (stageError) {
      const { message, err } = stageError;
      if (err) console.error(err, message);

      if (
        message ===
          $channelContent.notifications.error.request_to_join_stage_fail ||
        message === $playerContent.notification.error.error_loading_stream
      ) {
        notifyError(message);
      }

      updateError(null);
    }

    return;
  }, [
    stageError,
    notifyError,
    updateError,
    stageSuccessMessage,
    notifySuccess,
    updateSuccess
  ]);

  const { joinStageClient, leaveStageClient, resetAllStageState } =
    useStageClient();
  const { isLandscape, isMobileView } = useResponsiveDevice();
  const { isStackedView, isSplitView } = useChannelView();
  const { getProfileViewAnimationProps, chatAnimationControls } =
    useProfileViewAnimation();
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

  const [selectedTabIndex, setSelectedTabIndex] = useState(
    DEFAULT_SELECTED_TAB_INDEX
  );
  const channelRef = useRef();
  const previewRef = useRef();
  const chatSectionRef = useRef();
  const isMounted = useMount();
  const prevStageId = usePrevious(stageId);
  const shouldDisplayStagePlayerRef = useRef(false);
  const shouldDisplayStagePlayer =
    shouldDisplayStagePlayerRef.current && !!stageId;

  let visibleChatWidth = 360;
  if (isSplitView) visibleChatWidth = 308;
  else if (isStackedView) visibleChatWidth = '100%';

  const isTabView =
    shouldRenderActionInTab ||
    (isPollActive && isChannelPageStackedView && !shouldHideActivePoll);

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
   * IVS Real-time streaming
   */
  useEffect(() => {
    if (!shouldFetchSpectatorTokenRef.current || !stageId) return;

    shouldFetchSpectatorTokenRef.current = false;

    (async function () {
      try {
        const { result } = await retryWithExponentialBackoff({
          promiseFn: () => getSpectatorToken(stageId),
          maxRetries: 3
        });

        if (result?.token) {
          await joinStageClient({
            token: result.token,
            strategy
          });
          shouldDisplayStagePlayerRef.current = true;
        }
      } catch (err) {
        updateError({
          message: $playerContent.notification.error.error_loading_stream,
          err
        });
      }
    })();
  }, [
    joinStageClient,
    leaveStageClient,
    resetAllStageState,
    prevStageId,
    stageId,
    strategy,
    resetParticipants,
    updateError
  ]);

  useEffect(() => {
    const isRealTimeStreamEnded =
      (!stageId && prevStageId) || (prevStageId && prevStageId !== stageId);

    if (isRealTimeStreamEnded) {
      leaveStageClient();
      resetAllStageState();
      shouldFetchSpectatorTokenRef.current = true;
    }
  }, [leaveStageClient, prevStageId, resetAllStageState, stageId]);

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

        updateRequestingToJoinStage(false);
        resetAllStageState();
        leaveStageClient();
      }
    };
  }, [
    leaveStageClient,
    channelArn,
    publish,
    updateRequestingToJoinStage,
    userData?.channelId,
    resetAllStageState
  ]);

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
        if (requestingToJoinStage) {
          navigator.sendBeacon(
            `${apiBaseUrl}/stages/revokeStageRequest`,
            JSON.stringify(body)
          );
        }
      }, 0);
    });
  }, [channelArn, requestingToJoinStage, userData?.channelId]);

  useEffect(() => {
    window.addEventListener('beforeunload', beforeUnloadHandler);

    return () => {
      window.removeEventListener('beforeunload', beforeUnloadHandler);
    };
  }, [beforeUnloadHandler]);

  if (channelError) return <PageUnavailable />;

  return (
    <BroadcastFullscreenProvider previewRef={previewRef}>
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
    </BroadcastFullscreenProvider>
  );
};

export default Channel;
