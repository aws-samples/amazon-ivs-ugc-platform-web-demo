import { motion } from 'framer-motion';
import { useCallback, useState, useRef } from 'react';

import { channel as $channelContent } from '../../content';
import { clsm } from '../../utils';
import { Provider as NotificationProvider } from '../../contexts/Notification';
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

const DEFAULT_SELECTED_TAB_INDEX = 0;
const CHAT_PANEL_TAB_INDEX = 1;

const Channel = () => {
  const { channelError } = useChannel();
  const { isLandscape, isMobileView, isDesktopView } = useResponsiveDevice();
  const { isStackedView, isSplitView } = useChannelView();
  const { getProfileViewAnimationProps, chatAnimationControls } =
    useProfileViewAnimation();
  const {
    currentViewerStreamActionData,
    currentViewerStreamActionName,
    currentViewerStreamActionTitle,
    setCurrentViewerAction
    // shouldRenderActionInTab
  } = useViewerStreamActions();
  const { isActive } = usePoll();
  const shouldRenderActionInTab = isActive && !isDesktopView;
  const [selectedTabIndex, setSelectedTabIndex] = useState(
    DEFAULT_SELECTED_TAB_INDEX
  );
  const channelRef = useRef();
  const chatSectionRef = useRef();
  const isMounted = useMount();

  let visibleChatWidth = 360;
  if (isSplitView) visibleChatWidth = 308;
  else if (isStackedView) visibleChatWidth = '100%';

  const updateChatSectionHeight = useCallback(() => {
    let chatSectionHeight = 200;

    if (isStackedView) {
      /**
       * When switching between mobile landscape and portrait modes, channelWidth may not be accurate.
       * Therefore, we use the window.innerHeight instead; otherwise, we use the channel width.
       */
      const { innerWidth, innerHeight } = window;
      const { clientWidth: channelWidth } = channelRef.current;
      const width = isMobileView ? innerWidth : channelWidth;

      chatSectionHeight = Math.max(innerHeight - (width * 9) / 16, 200); // chat section should be no less than 200px in height
    }

    chatSectionRef.current.style.minHeight = `${chatSectionHeight}px`;
  }, [isMobileView, isStackedView]);

  useResize(updateChatSectionHeight, { shouldCallOnMount: true });

  // Ensures we have computed and set the chat section min-height before the first render
  useLayoutEffect(() => {
    if (!isMounted()) updateChatSectionHeight();
  }, [isMounted, updateChatSectionHeight]);

  if (channelError) return <PageUnavailable />;

  return (
    <PlayerProvider>
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
        <NotificationProvider>
          <Player chatSectionRef={chatSectionRef} />
        </NotificationProvider>
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
              {shouldRenderActionInTab && (
                <>
                  <Tabs.List
                    selectedIndex={selectedTabIndex}
                    setSelectedIndex={setSelectedTabIndex}
                    tabs={[
                      {
                        // temporary code. It will be repolaced once we get to integration ticket
                        label: shouldRenderActionInTab
                          ? 'Live poll'
                          : currentViewerStreamActionTitle,
                        panelIndex: 0
                      },
                      { label: $channelContent.tabs.chat, panelIndex: 1 }
                    ]}
                  />
                  <Tabs.Panel index={0} selectedIndex={selectedTabIndex}>
                    {isActive && (
                      <NotificationProvider>
                        <ChatProvider>
                          <Poll />
                        </ChatProvider>
                      </NotificationProvider>
                    )}
                    {currentViewerStreamActionName ===
                      STREAM_ACTION_NAME.QUIZ && (
                      <QuizViewerStreamAction
                        {...currentViewerStreamActionData}
                        setCurrentViewerAction={setCurrentViewerAction}
                        shouldRenderActionInTab={shouldRenderActionInTab}
                      />
                    )}
                    {[
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
              {selectedTabIndex === 0 && shouldRenderActionInTab && (
                <ProfileViewFloatingNav
                  containerClassName="fixed"
                  reverseVisibility
                />
              )}
              <Tabs.Panel
                index={1}
                selectedIndex={
                  shouldRenderActionInTab
                    ? selectedTabIndex
                    : CHAT_PANEL_TAB_INDEX
                }
              >
                <NotificationProvider>
                  <ChatProvider>
                    {!shouldRenderActionInTab && isActive && <Poll />}
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
