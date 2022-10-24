import { m, useAnimation } from 'framer-motion';
import { useEffect, useState, useCallback, useRef } from 'react';

import { BREAKPOINTS, STREAM_ACTION_NAME } from '../../constants';
import { channel as $channelContent } from '../../content';
import { clsm } from '../../utils';
import { Provider as NotificationProvider } from '../../contexts/Notification';
import { useChannel } from '../../contexts/Channel';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice';
import { useUser } from '../../contexts/User';
import { useViewerStreamActions } from '../../contexts/ViewerStreamActions';
import Chat from './Chat';
import MobileNavbar from '../../layouts/AppLayoutWithNavbar/Navbar/MobileNavbar';
import PageUnavailable from '../../components/PageUnavailable';
import Player from '../../components/Player';
import ProductDescriptionModal from './ViewerStreamActions/Product/ProductDescriptionModal';
import ProductViewerStreamAction from './ViewerStreamActions/Product';
import QuizCard from './ViewerStreamActions/QuizCard';
import Tabs from '../../components/Tabs/Tabs';
import useCountdown from '../../hooks/useCountdown';

const chatDefaultTransition = { duration: 0.25, type: 'tween' };

const DEFAULT_SELECTED_TAB_INDEX = 0;
const CHAT_PANEL_TAB_INDEX = 1;

const Channel = () => {
  const [selectedTabIndex, setSelectedTabIndex] = useState(
    DEFAULT_SELECTED_TAB_INDEX
  );
  const chatContainerRef = useRef();
  const { isSessionValid } = useUser();
  const { isLandscape, isMobileView, currentBreakpoint } =
    useResponsiveDevice();
  const {
    clearCurrentViewerAction,
    currentViewerStreamActionData,
    currentViewerStreamActionName,
    currentViewerStreamActionTitle,
    setCurrentViewerAction,
    shouldRenderActionInTab
  } = useViewerStreamActions();
  const isCelebrationViewerAction =
    currentViewerStreamActionName === STREAM_ACTION_NAME.CELEBRATION;
  const { duration: viewerActionDuration, startTime: viewerActionStartTime } =
    currentViewerStreamActionData;
  const viewerActionExpiry =
    typeof viewerActionDuration === 'number' &&
    typeof viewerActionStartTime === 'number'
      ? viewerActionStartTime + viewerActionDuration * 1000
      : null;
  useCountdown({
    expiry: viewerActionExpiry,
    isEnabled: isCelebrationViewerAction && viewerActionExpiry,
    onExpiry: clearCurrentViewerAction
  });
  const { channelData, channelError } = useChannel();
  const [isChatVisible, setIsChatVisible] = useState(true);
  const chatAnimationControls = useAnimation();
  const isSplitView = isMobileView && isLandscape;
  const isStackedView = currentBreakpoint < BREAKPOINTS.lg;

  const toggleChat = useCallback(
    ({ value, skipAnimation } = {}) => {
      const transitionFn = skipAnimation
        ? chatAnimationControls.set
        : chatAnimationControls.start;

      setIsChatVisible((prev) => {
        const next = value || !prev;

        transitionFn(next ? 'visible' : 'hidden');

        return next;
      });
    },
    [chatAnimationControls]
  );

  // Show chat and skip animation when the layout changes
  useEffect(() => {
    toggleChat({ value: true, skipAnimation: true });
  }, [isSplitView, isStackedView, toggleChat]);

  if (channelError) return <PageUnavailable />;

  return (
    <div
      className={clsm([
        'flex',
        'items-center',
        'justify-center',
        'text-center',
        'overflow-x-hidden',
        /* Default View */
        'w-full',
        'h-screen',
        'flex-row',
        /* Stacked View */
        'lg:flex-col',
        'lg:h-full',
        'lg:min-h-screen',
        /* Split View */
        isLandscape && [
          'md:flex-row',
          'md:h-screen',
          'touch-screen-device:lg:flex-row',
          'touch-screen-device:lg:h-screen'
        ]
      ])}
    >
      <NotificationProvider>
        <Player
          isChatVisible={isChatVisible}
          toggleChat={toggleChat}
          channelData={channelData}
        />
      </NotificationProvider>
      <ProductDescriptionModal />
      <m.section
        ref={chatContainerRef}
        animate={chatAnimationControls}
        initial="visible"
        exit="hidden"
        variants={{
          visible: {
            x: 0,
            width: isSplitView ? 308 : isStackedView ? '100%' : 360,
            transitionEnd: { x: 0 }
          },
          hidden: { x: '100%', width: 0 }
        }}
        transition={chatDefaultTransition}
        className={clsm([
          'relative',
          'flex',
          'flex-shrink-0',
          'bg-white',
          'dark:bg-darkMode-gray-dark',
          'overflow-hidden',
          /* Default View */
          'w-[360px]',
          'h-screen',
          /* Stacked View */
          'lg:w-full',
          'lg:h-full',
          'lg:flex-grow',
          'lg:min-h-[200px]',
          /* Split View */
          isLandscape && [
            'md:w-[308px]',
            'md:h-screen',
            'md:min-h-[auto]',
            'touch-screen-device:lg:w-[308px]',
            'touch-screen-device:lg:h-screen',
            'touch-screen-device:lg:min-h-[auto]'
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
                  { label: currentViewerStreamActionTitle, panelIndex: 0 },
                  { label: $channelContent.tabs.chat, panelIndex: 1 }
                ]}
              />
              <Tabs.Panel index={0} selectedIndex={selectedTabIndex}>
                {currentViewerStreamActionName === STREAM_ACTION_NAME.QUIZ && (
                  <QuizCard
                    {...currentViewerStreamActionData}
                    setCurrentViewerAction={setCurrentViewerAction}
                    shouldRenderActionInTab={shouldRenderActionInTab}
                  />
                )}
                {currentViewerStreamActionName ===
                  STREAM_ACTION_NAME.PRODUCT && (
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
                      {...currentViewerStreamActionData}
                    />
                  </div>
                )}
              </Tabs.Panel>
            </>
          )}
          <Tabs.Panel
            index={1}
            selectedIndex={
              shouldRenderActionInTab ? selectedTabIndex : CHAT_PANEL_TAB_INDEX
            }
          >
            <NotificationProvider>
              <Chat
                chatContainerRef={chatContainerRef}
                shouldRunCelebration={isCelebrationViewerAction}
              />
            </NotificationProvider>
          </Tabs.Panel>
        </Tabs>
      </m.section>
      {isSplitView && !isSessionValid && !isChatVisible && (
        <MobileNavbar
          className={clsm(
            isLandscape && 'lg:max-w-[calc(100vw_-_(352px_+_96px))]'
          )}
        />
      )}
    </div>
  );
};

export default Channel;
